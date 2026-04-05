import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Loader2, Warehouse } from 'lucide-react';
import { Button } from '@shared/ui';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import HallCard, { Hall } from './HallCard';
import AddEditHallDrawer from './AddEditHallDrawer';

interface HallsListViewProps {
  instanceId: string;
}

interface Station {
  id: string;
  name: string;
}

interface HallUser {
  hall_id: string;
  username: string;
}

const HallsListView = ({ instanceId }: HallsListViewProps) => {
  const { t } = useTranslation();
  const [halls, setHalls] = useState<Hall[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [hallUsers, setHallUsers] = useState<HallUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingHall, setEditingHall] = useState<Hall | null>(null);
  const [instanceSlug, setInstanceSlug] = useState<string>('');

  const fetchHalls = async () => {
    try {
      const { data, error } = await supabase
        .from('halls')
        .select('*')
        .eq('instance_id', instanceId)
        .eq('active', true)
        .order('sort_order');

      if (error) throw error;

      // Map database response to Hall type
      const mappedHalls: Hall[] = (data || []).map((h) => ({
        id: h.id,
        instance_id: h.instance_id,
        name: h.name,
        slug: h.slug,
        station_ids: h.station_ids || [],
        visible_fields: (h.visible_fields as Hall['visible_fields']) || {
          customer_name: true,
          customer_phone: false,
          vehicle_plate: true,
          services: true,
          admin_notes: false,
          price: false,
        },
        allowed_actions: (h.allowed_actions as Hall['allowed_actions']) || {
          add_services: false,
          change_time: false,
          change_station: false,
          edit_reservation: false,
          delete_reservation: false,
        },
        sort_order: h.sort_order || 0,
        active: h.active,
      }));

      setHalls(mappedHalls);
    } catch (error) {
      console.error('Error fetching halls:', error);
      toast.error(t('common.error'));
    }
  };

  const fetchInstanceSlug = async () => {
    const { data } = await supabase.from('instances').select('slug').eq('id', instanceId).single();

    if (data) {
      setInstanceSlug(data.slug);
    }
  };

  const fetchStations = async () => {
    const { data } = await supabase
      .from('stations')
      .select('id, name')
      .eq('instance_id', instanceId)
      .eq('active', true)
      .order('sort_order');

    if (data) {
      setStations(data);
    }
  };

  const fetchHallUsers = async () => {
    // Use edge function (bypasses RLS) to get users with hall assignments
    const response = await supabase.functions.invoke('manage-instance-users', {
      body: { action: 'list', instanceId },
    });

    if (response.error || response.data?.error) {
      setHallUsers([]);
      return;
    }

    const users: HallUser[] = (response.data?.users || [])
      .filter((u: { role: string; hall_id?: string | null }) => u.role === 'hall' && u.hall_id)
      .map((u: { hall_id: string; username: string }) => ({
        hall_id: u.hall_id,
        username: u.username,
      }));

    setHallUsers(users);
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchHalls(), fetchInstanceSlug(), fetchStations(), fetchHallUsers()]);
      setLoading(false);
    };
    loadAll();
    // fetchHalls, fetchInstanceSlug, fetchStations, fetchHallUsers are stable functions
    // defined in component scope that only depend on instanceId (already in deps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId]);

  const hallUsersMap = useMemo(
    () => new Map(hallUsers.map((u) => [u.hall_id, u.username])),
    [hallUsers],
  );

  const handleEdit = (hall: Hall) => {
    setEditingHall(hall);
    setDrawerOpen(true);
  };

  const handleDelete = async (hallId: string) => {
    try {
      const { error } = await supabase.from('halls').update({ active: false }).eq('id', hallId);

      if (error) throw error;

      setHalls((prev) => prev.filter((h) => h.id !== hallId));
      toast.success(t('halls.deleted'));
    } catch (error) {
      console.error('Error deleting hall:', error);
      toast.error(t('common.error'));
    }
  };

  const handleAddNew = () => {
    setEditingHall(null);
    setDrawerOpen(true);
  };

  const handleSaved = () => {
    fetchHalls();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{t('halls.title')}</h3>
          <p className="text-muted-foreground text-sm mt-1">{t('halls.description')}</p>
        </div>
        {halls.length > 0 && <Button onClick={handleAddNew}>{t('halls.add')}</Button>}
      </div>

      {halls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Warehouse className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">{t('halls.noHalls')}</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm">
            {t('halls.noHallsDescription')}
          </p>
          <Button onClick={handleAddNew} className="mt-4">
            {t('halls.addFirst')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {halls.map((hall, index) => (
            <HallCard
              key={hall.id}
              hall={hall}
              hallNumber={index + 1}
              instanceSlug={instanceSlug}
              stations={stations}
              assignedUsername={hallUsersMap.get(hall.id)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AddEditHallDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        instanceId={instanceId}
        hall={editingHall}
        onSaved={handleSaved}
      />
    </div>
  );
};

export default HallsListView;
