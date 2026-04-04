import { useState, useEffect } from 'react';
import { Loader2, MoreVertical, User, Lock, Unlock, Trash2, KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@shared/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import AddInstanceUserDialog from './AddInstanceUserDialog';
import EditInstanceUserDialog from './EditInstanceUserDialog';
import ResetPasswordDialog from './ResetPasswordDialog';
import DeleteUserDialog from './DeleteUserDialog';

interface InstanceUser {
  id: string;
  username: string;
  email: string;
  is_blocked: boolean;
  created_at: string;
  role: 'admin' | 'employee' | 'hall' | 'sales';
}

interface InstanceUsersTabProps {
  instanceId: string;
}

const InstanceUsersTab = ({ instanceId }: InstanceUsersTabProps) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<InstanceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<InstanceUser | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('instanceUsers.sessionExpired'));
        return;
      }

      const response = await supabase.functions.invoke('manage-instance-users', {
        body: {
          action: 'list',
          instanceId,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      const fetchedUsers = (response.data?.users || []) as InstanceUser[];
      setUsers(
        fetchedUsers.map((u) => ({
          ...u,
          username: u.username || t('common.noName', 'Brak nazwy'),
        })),
      );
    } catch (error: unknown) {
      console.error('Error fetching users:', error);
      toast.error((error as Error).message || t('instanceUsers.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (instanceId) {
      fetchUsers();
    }
  }, [instanceId]);

  const handleBlockUnblock = async (user: InstanceUser) => {
    setActionLoading(user.id);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('instanceUsers.sessionExpired'));
        return;
      }

      const response = await supabase.functions.invoke('manage-instance-users', {
        body: {
          action: user.is_blocked ? 'unblock' : 'block',
          instanceId,
          userId: user.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success(
        user.is_blocked ? t('instanceUsers.userUnblocked') : t('instanceUsers.userBlocked'),
      );
      fetchUsers();
    } catch (error: unknown) {
      console.error('Error blocking/unblocking user:', error);
      toast.error((error as Error).message || t('errors.generic'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (user: InstanceUser) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleResetPassword = (user: InstanceUser) => {
    setSelectedUser(user);
    setResetPasswordDialogOpen(true);
  };

  const handleDelete = (user: InstanceUser) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const getRoleLabel = (role: 'admin' | 'employee' | 'hall' | 'sales') => {
    if (role === 'admin') return t('instanceUsers.admin');
    if (role === 'sales') return 'Sprzedaż';
    if (role === 'hall') return 'Hala';
    return t('instanceUsers.employee');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('instanceUsers.title')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Zarządzaj kontami użytkowników z dostępem do panelu
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} size="sm">
          {t('instanceUsers.addUser')}
        </Button>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{t('instanceUsers.noUsers')}</p>
          <Button variant="link" onClick={() => setAddDialogOpen(true)} className="mt-2">
            {t('instanceUsers.addFirstUser')}
          </Button>
        </div>
      ) : (
        <div className="border border-border/50 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nazwa</TableHead>
                <TableHead>Rola</TableHead>
                <TableHead>Utworzono</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{getRoleLabel(user.role)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(user.created_at), 'd MMM yyyy', { locale: pl })}
                  </TableCell>
                  <TableCell>
                    {user.is_blocked ? (
                      <span className="text-destructive">{t('instanceUsers.blocked')}</span>
                    ) : (
                      <span className="text-emerald-600">{t('instanceUsers.active')}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={actionLoading === user.id}
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <MoreVertical className="w-4 h-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                          <User className="w-4 h-4 mr-2" />
                          {t('instanceUsers.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                          <KeyRound className="w-4 h-4 mr-2" />
                          {t('instanceUsers.resetPassword')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleBlockUnblock(user)}>
                          {user.is_blocked ? (
                            <>
                              <Unlock className="w-4 h-4 mr-2" />
                              {t('instanceUsers.unblock')}
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 mr-2" />
                              {t('instanceUsers.block')}
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(user)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t('instanceUsers.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddInstanceUserDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        instanceId={instanceId}
        onSuccess={fetchUsers}
      />

      <EditInstanceUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        instanceId={instanceId}
        user={selectedUser}
        onSuccess={fetchUsers}
      />

      <ResetPasswordDialog
        open={resetPasswordDialogOpen}
        onOpenChange={setResetPasswordDialogOpen}
        instanceId={instanceId}
        user={selectedUser}
      />

      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        instanceId={instanceId}
        user={selectedUser}
        onSuccess={fetchUsers}
      />
    </div>
  );
};

export default InstanceUsersTab;
