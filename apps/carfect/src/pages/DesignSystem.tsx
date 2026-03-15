import { useState } from 'react';
import { Star, X, ShoppingCart, Users, Search } from 'lucide-react';
import { Button } from '@shared/ui';
import { Badge } from '@shared/ui';
import { ToggleGroup, ToggleGroupItem } from '@shared/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@shared/ui';
import { Input } from '@shared/ui';
import { Textarea } from '@shared/ui';
import { Checkbox } from '@shared/ui';
import { Switch } from '@shared/ui';
import { Separator } from '@shared/ui';
import { Label as UILabel } from '@shared/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@shared/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/ui';
import { toast } from 'sonner';
import DatePicker from '@/components/booking/DatePicker';
import { EmptyState } from '@shared/ui';
import { PageLoader } from '@shared/ui';
import { PhotoUploader } from '@/components/ui/photo-uploader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@shared/ui';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@shared/ui';
import { ConfirmDialog } from '@shared/ui';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shared/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui';
import { Skeleton } from '@shared/ui';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@shared/ui';
import { Info, MoreVertical, Pencil, Trash2, Copy, ChevronDown } from 'lucide-react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-4">
    <h2 className="text-xl font-semibold border-b pb-2">{title}</h2>
    {children}
  </section>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="text-xs text-muted-foreground font-mono">{children}</span>
);

const buttonVariants = [
  'default',
  'destructive',
  'outline',
  'secondary',
  'ghost',
  'link',
  'hero',
  'glass',
  'success',
] as const;
const buttonSizes = ['default', 'sm', 'lg', 'xl'] as const;
const badgeVariants = ['default', 'secondary', 'destructive', 'outline'] as const;

// --- Color swatch ---
const ColorSwatch = ({ name, cssVar }: { name: string; cssVar: string }) => (
  <div className="flex items-center gap-3">
    <div
      className="w-10 h-10 rounded-md border border-border shrink-0"
      style={{ backgroundColor: `hsl(var(${cssVar}))` }}
    />
    <div>
      <p className="text-sm font-medium">{name}</p>
      <p className="text-xs text-muted-foreground font-mono">{cssVar}</p>
    </div>
  </div>
);

const colorGroups = [
  {
    title: 'Podstawowe',
    colors: [
      { name: 'Background', cssVar: '--background' },
      { name: 'Foreground', cssVar: '--foreground' },
      { name: 'Card', cssVar: '--card' },
      { name: 'Card Foreground', cssVar: '--card-foreground' },
    ],
  },
  {
    title: 'Primary / Secondary',
    colors: [
      { name: 'Primary', cssVar: '--primary' },
      { name: 'Primary Foreground', cssVar: '--primary-foreground' },
      { name: 'Secondary', cssVar: '--secondary' },
      { name: 'Secondary Foreground', cssVar: '--secondary-foreground' },
    ],
  },
  {
    title: 'Semantyczne',
    colors: [
      { name: 'Success', cssVar: '--success' },
      { name: 'Warning', cssVar: '--warning' },
      { name: 'Destructive', cssVar: '--destructive' },
    ],
  },
  {
    title: 'Muted / Accent',
    colors: [
      { name: 'Muted', cssVar: '--muted' },
      { name: 'Muted Foreground', cssVar: '--muted-foreground' },
      { name: 'Accent', cssVar: '--accent' },
      { name: 'Hover', cssVar: '--hover' },
    ],
  },
  {
    title: 'Border / Ring / Input',
    colors: [
      { name: 'Border', cssVar: '--border' },
      { name: 'Ring', cssVar: '--ring' },
      { name: 'Input', cssVar: '--input' },
    ],
  },
  {
    title: 'Sidebar',
    colors: [
      { name: 'Sidebar Background', cssVar: '--sidebar-background' },
      { name: 'Sidebar Primary', cssVar: '--sidebar-primary' },
      { name: 'Sidebar Accent', cssVar: '--sidebar-accent' },
      { name: 'Sidebar Border', cssVar: '--sidebar-border' },
    ],
  },
  {
    title: 'Chart',
    colors: [
      { name: 'Chart 1', cssVar: '--chart-1' },
      { name: 'Chart 2', cssVar: '--chart-2' },
      { name: 'Chart 3', cssVar: '--chart-3' },
      { name: 'Chart 4', cssVar: '--chart-4' },
      { name: 'Chart 5', cssVar: '--chart-5' },
    ],
  },
];

// --- Components Tab ---
const ComponentsTab = () => {
  const [toggleValue, setToggleValue] = useState('a');
  const [toggleValue2, setToggleValue2] = useState('a');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [switchChecked, setSwitchChecked] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDestructiveOpen, setConfirmDestructiveOpen] = useState(false);
  const [demoPhotos, setDemoPhotos] = useState<string[]>([]);
  const [chips, setChips] = useState([
    'Mycie zewnętrzne',
    'Polerowanie',
    'Detailing wnętrza',
    'Woskowanie',
  ]);
  const [paginationPage, setPaginationPage] = useState(2);
  const [collapsibleOpen, setCollapsibleOpen] = useState(false);

  return (
    <div className="space-y-12">
      {/* Buttons — variants */}
      <Section title="Button — warianty">
        <div className="flex flex-wrap gap-3 items-center">
          {buttonVariants.map((variant) => (
            <div key={variant} className="flex flex-col items-center gap-1.5">
              <Button variant={variant}>{variant}</Button>
              <Label>{variant}</Label>
            </div>
          ))}
        </div>
      </Section>

      {/* Buttons — sizes */}
      <Section title="Button — rozmiary">
        <div className="flex flex-wrap gap-3 items-end">
          {buttonSizes.map((size) => (
            <div key={size} className="flex flex-col items-center gap-1.5">
              <Button size={size}>{size}</Button>
              <Label>size="{size}"</Label>
            </div>
          ))}
          <div className="flex flex-col items-center gap-1.5">
            <Button size="icon">
              <Star className="w-5 h-5" />
            </Button>
            <Label>size="icon"</Label>
          </div>
        </div>
      </Section>

      {/* Badges */}
      <Section title="Badge">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>size="default"</Label>
            <div className="flex flex-wrap gap-3 items-center">
              {badgeVariants.map((variant) => (
                <div key={variant} className="flex flex-col items-center gap-1.5">
                  <Badge variant={variant}>{variant}</Badge>
                  <Label>{variant}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>size="lg"</Label>
            <div className="flex flex-wrap gap-3 items-center">
              {badgeVariants.map((variant) => (
                <div key={variant} className="flex flex-col items-center gap-1.5">
                  <Badge variant={variant} size="lg">
                    {variant}
                  </Badge>
                  <Label>{variant}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ToggleGroup — pills */}
      <Section title="ToggleGroup (Pills)">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>variant="default" size="default"</Label>
            <ToggleGroup
              type="single"
              value={toggleValue}
              onValueChange={(v) => {
                if (v) setToggleValue(v);
              }}
            >
              <ToggleGroupItem value="a">Opcja A</ToggleGroupItem>
              <ToggleGroupItem value="b">Opcja B</ToggleGroupItem>
              <ToggleGroupItem value="c">Opcja C</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-1.5">
            <Label>variant="outline" size="sm"</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={toggleValue2}
              onValueChange={(v) => {
                if (v) setToggleValue2(v);
              }}
            >
              <ToggleGroupItem value="a">Wysyłka</ToggleGroupItem>
              <ToggleGroupItem value="b">Odbiór</ToggleGroupItem>
              <ToggleGroupItem value="c">Uber</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </Section>

      {/* Form Controls */}
      <Section title="Form Controls">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Input</Label>
            <Input placeholder="Wpisz tekst..." />
          </div>

          <div className="space-y-2">
            <Label>Input disabled</Label>
            <Input placeholder="Disabled..." disabled />
          </div>

          <div className="space-y-2">
            <Label>Select</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz opcję" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Opcja A</SelectItem>
                <SelectItem value="b">Opcja B</SelectItem>
                <SelectItem value="c">Opcja C</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Textarea</Label>
            <Textarea placeholder="Wpisz dłuższy tekst..." rows={3} />
          </div>

          <div className="space-y-3">
            <Label>Checkbox</Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id="ds-checkbox"
                checked={checkboxChecked}
                onCheckedChange={(v) => setCheckboxChecked(v === true)}
              />
              <UILabel htmlFor="ds-checkbox" className="text-sm font-normal cursor-pointer">
                Zaznacz opcję
              </UILabel>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Switch</Label>
            <div className="flex items-center gap-2">
              <Switch id="ds-switch" checked={switchChecked} onCheckedChange={setSwitchChecked} />
              <UILabel htmlFor="ds-switch" className="text-sm font-normal cursor-pointer">
                Włącz / wyłącz
              </UILabel>
            </div>
          </div>
        </div>
      </Section>

      {/* DatePicker */}
      <Section title="DatePicker (Calendar)">
        <div className="max-w-sm">
          <DatePicker selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </div>
      </Section>

      {/* Tabs */}
      <Section title="Tabs">
        <div className="space-y-6">
          <div className="space-y-1.5">
            <Label>variant="default"</Label>
            <Tabs defaultValue="tab1">
              <TabsList>
                <TabsTrigger value="tab1">Zamówienia</TabsTrigger>
                <TabsTrigger value="tab2">Klienci</TabsTrigger>
                <TabsTrigger value="tab3">Produkty</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1">
                <p className="text-sm text-muted-foreground p-2">Treść zamówień</p>
              </TabsContent>
              <TabsContent value="tab2">
                <p className="text-sm text-muted-foreground p-2">Treść klientów</p>
              </TabsContent>
              <TabsContent value="tab3">
                <p className="text-sm text-muted-foreground p-2">Treść produktów</p>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-1.5">
            <Label>variant="underline"</Label>
            <Tabs defaultValue="tab1">
              <TabsList>
                <TabsTrigger value="tab1">Zamówienia</TabsTrigger>
                <TabsTrigger value="tab2">Klienci</TabsTrigger>
                <TabsTrigger value="tab3">Produkty</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1">
                <p className="text-sm text-muted-foreground p-2">Treść zamówień</p>
              </TabsContent>
              <TabsContent value="tab2">
                <p className="text-sm text-muted-foreground p-2">Treść klientów</p>
              </TabsContent>
              <TabsContent value="tab3">
                <p className="text-sm text-muted-foreground p-2">Treść produktów</p>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Section>

      {/* Table */}
      <Section title="Table">
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[120px]">Nr zamówienia</TableHead>
                <TableHead>Klient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-[120px]">Kwota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="cursor-pointer">
                <TableCell className="font-medium">ZAM-001</TableCell>
                <TableCell>Jan Kowalski</TableCell>
                <TableCell>
                  <Badge size="lg">Nowe</Badge>
                </TableCell>
                <TableCell className="text-right">1 250,00 zł</TableCell>
              </TableRow>
              <TableRow className="cursor-pointer">
                <TableCell className="font-medium">ZAM-002</TableCell>
                <TableCell>Anna Nowak</TableCell>
                <TableCell>
                  <Badge variant="secondary" size="lg">
                    W realizacji
                  </Badge>
                </TableCell>
                <TableCell className="text-right">890,50 zł</TableCell>
              </TableRow>
              <TableRow className="cursor-pointer">
                <TableCell className="font-medium">ZAM-003</TableCell>
                <TableCell>Piotr Wiśniewski</TableCell>
                <TableCell>
                  <Badge variant="destructive" size="lg">
                    Anulowane
                  </Badge>
                </TableCell>
                <TableCell className="text-right">2 100,00 zł</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Section>

      {/* Pagination */}
      <Section title="Pagination">
        <div className="space-y-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPaginationPage(Math.max(1, paginationPage - 1));
                  }}
                />
              </PaginationItem>
              {[1, 2, 3].map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={page === paginationPage}
                    onClick={(e) => {
                      e.preventDefault();
                      setPaginationPage(page);
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPaginationPage(Math.min(3, paginationPage + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Section>

      {/* Removable Pills / Chips */}
      <Section title="Removable Pills (Chips)">
        <p className="text-sm text-muted-foreground">
          Pills z X — używane do wybranych usług, pracowników, filtrów. Wzorzec:
          AssignedEmployeesChips.
        </p>
        <div className="flex flex-wrap gap-1.5 items-center">
          {chips.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium bg-foreground text-background leading-none"
            >
              {chip}
              <button
                type="button"
                onClick={() => setChips(chips.filter((c) => c !== chip))}
                className="ml-0.5 hover:opacity-70"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
          {chips.length < 4 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                setChips(['Mycie zewnętrzne', 'Polerowanie', 'Detailing wnętrza', 'Woskowanie'])
              }
            >
              Reset
            </Button>
          )}
        </div>
        <div className="space-y-1.5 mt-4">
          <Label>variant="outline" (readonly)</Label>
          <div className="flex flex-wrap gap-1.5">
            {['Jan K.', 'Anna N.', 'Piotr W.'].map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium bg-muted text-muted-foreground leading-none"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* Tooltip */}
      <Section title="Tooltip">
        <div className="flex flex-wrap gap-4 items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Info className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Informacja pomocnicza</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">
                  Najedź na mnie
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Tooltip od dołu</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm text-muted-foreground underline decoration-dashed cursor-help">
                  netto→brutto
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ceny netto przeliczane na brutto (×1.23)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Section>

      {/* Dropdown Menu */}
      <Section title="Dropdown Menu">
        <div className="flex flex-wrap gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4 mr-2" />
                Akcje
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Zamówienie</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Pencil className="w-4 h-4 mr-2" />
                Edytuj
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="w-4 h-4 mr-2" />
                Duplikuj
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Usuń
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Pencil className="w-4 h-4 mr-2" />
                Edytuj
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Usuń
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Section>

      {/* Skeleton */}
      <Section title="Skeleton">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Karta ładowania</Label>
            <div className="bg-card border rounded-md p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[140px]" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[80%]" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tabela ładowania</Label>
            <div className="bg-card border rounded-md p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Collapsible */}
      <Section title="Collapsible">
        <Collapsible open={collapsibleOpen} onOpenChange={setCollapsibleOpen}>
          <div className="bg-card border rounded-md">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-hover transition-colors rounded-md"
              >
                Ustawienia zaawansowane
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${collapsibleOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-3 border-t pt-3">
                <div className="space-y-2">
                  <UILabel>Kod rabatowy</UILabel>
                  <Input placeholder="np. SUMMER2025" />
                </div>
                <div className="space-y-2">
                  <UILabel>Notatka wewnętrzna</UILabel>
                  <Textarea placeholder="Widoczna tylko dla zespołu..." rows={2} />
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </Section>

      {/* Separator */}
      <Section title="Separator">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Horizontal</Label>
            <div className="bg-card border rounded-md p-4 space-y-3">
              <p className="text-sm">Sekcja A</p>
              <Separator />
              <p className="text-sm">Sekcja B</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Vertical</Label>
            <div className="bg-card border rounded-md p-4 flex items-center gap-3 h-10">
              <span className="text-sm">Lewo</span>
              <Separator orientation="vertical" />
              <span className="text-sm">Prawo</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Empty State */}
      <Section title="Empty State">
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-md">
            <EmptyState
              title="Brak zamówień"
              description="Nie masz jeszcze żadnych zamówień. Dodaj pierwsze zamówienie."
            >
              <Button size="sm">Dodaj zamówienie</Button>
            </EmptyState>
          </div>
          <div className="border rounded-md">
            <EmptyState
              icon={Users}
              title="Brak klientów"
              description="Lista klientów jest pusta."
            />
          </div>
          <div className="border rounded-md">
            <EmptyState
              icon={Search}
              title="Brak wyników"
              description="Nie znaleziono pasujących elementów."
            />
          </div>
          <div className="border rounded-md">
            <EmptyState icon={ShoppingCart} title="Koszyk pusty" />
          </div>
        </div>
      </Section>

      {/* Page Loader */}
      <Section title="Page Loader">
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-md">
            <PageLoader />
          </div>
          <div className="border rounded-md">
            <PageLoader label="Ładowanie zamówień..." />
          </div>
        </div>
      </Section>

      {/* Toasts */}
      <Section title="Toast (Sonner)">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={() => toast.success('Zamówienie zapisane')}>
            Success
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.success('Zamówienie usunięte', {
                action: { label: 'Cofnij', onClick: () => toast.success('Przywrócono zamówienie') },
              })
            }
          >
            Success + Cofnij
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.error('Błąd przy zapisie')}>
            Error
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Nowe zamówienie do weryfikacji')}
          >
            Info
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast('Powiadomienie', { action: { label: 'Cofnij', onClick: () => {} } })
            }
          >
            Default + akcja
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast('Usunięto element', {
                action: { label: 'Przywróć', onClick: () => toast.success('Przywrócono') },
              })
            }
          >
            Cofnij akcję
          </Button>
        </div>
      </Section>

      {/* Photo Uploader */}
      <Section title="PhotoUploader">
        <p className="text-sm text-muted-foreground">
          Grid zdjęć z upload, delete, fullscreen preview + annotation. Używany w protokołach.
        </p>
        <div className="max-w-md">
          <PhotoUploader
            photos={demoPhotos}
            onPhotosChange={setDemoPhotos}
            bucketName="order-attachments"
            filePrefix="design-system-demo"
            maxPhotos={6}
          />
        </div>
      </Section>

      {/* Drawer Layout */}
      <Section title="Drawer Layout">
        <p className="text-sm text-muted-foreground">
          Szablon: Sheet + SheetContent (right, --drawer-width) + fixed Header/Footer + scrollable
          content.
        </p>
        <Button onClick={() => setDrawerOpen(true)}>Otwórz Drawer</Button>
      </Section>

      {/* Confirm Dialog */}
      <Section title="Confirm Dialog">
        <p className="text-sm text-muted-foreground">
          ConfirmDialog — gotowy komponent potwierdzenia. Na mobile automatycznie Drawer.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setConfirmOpen(true)}>
            Default
          </Button>
          <Button variant="destructive" onClick={() => setConfirmDestructiveOpen(true)}>
            Destructive
          </Button>
        </div>
      </Section>

      {/* Dialog with content */}
      <Section title="Dialog (z contentem)">
        <p className="text-sm text-muted-foreground">
          Dialog z fixed header, scrollable content, fixed footer. Wzorzec: ServiceFormDialog,
          ProductDetailsDialog.
        </p>
        <Button onClick={() => setContentDialogOpen(true)}>Otwórz Dialog</Button>
      </Section>

      {/* Drawer demo */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen} modal={false}>
        <SheetContent
          side="right"
          className="w-full flex flex-col h-full p-0 gap-0 shadow-[-8px_0_30px_-12px_rgba(0,0,0,0.15)] bg-white text-foreground [&_input]:border-foreground/60 [&_textarea]:border-foreground/60 [&_label]:text-foreground sm:max-w-[var(--drawer-width)]"
          hideOverlay
          hideCloseButton
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle>Przykładowy Drawer</SheetTitle>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-full hover:bg-hover transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <UILabel>Nazwa</UILabel>
                <Input placeholder="Wpisz nazwę..." />
              </div>
              <div className="space-y-2">
                <UILabel>Opis</UILabel>
                <Textarea placeholder="Opis..." rows={4} />
              </div>
              <div className="space-y-2">
                <UILabel>Kategoria</UILabel>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a">Kategoria A</SelectItem>
                    <SelectItem value="b">Kategoria B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <SheetFooter className="px-6 py-4 border-t shrink-0">
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setDrawerOpen(false)}>
                Anuluj
              </Button>
              <Button className="flex-1" onClick={() => setDrawerOpen(false)}>
                Zapisz
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Confirm Dialog demos */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Potwierdzenie"
        description="Czy na pewno chcesz wykonać tę akcję?"
        onConfirm={() => toast.success('Potwierdzone')}
      />
      <ConfirmDialog
        open={confirmDestructiveOpen}
        onOpenChange={setConfirmDestructiveOpen}
        title="Usunąć zamówienie?"
        description="Tej operacji nie można cofnąć. Zamówienie zostanie trwale usunięte."
        confirmLabel="Usuń"
        variant="destructive"
        onConfirm={() => toast.success('Usunięto')}
      />

      {/* Dialog with content demo */}
      <Dialog open={contentDialogOpen} onOpenChange={setContentDialogOpen}>
        <DialogContent
          className="w-[90vw] max-w-[600px] h-[70vh] max-h-[70vh] flex flex-col p-0 gap-0"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="shrink-0 p-6 pb-4 border-b">
            <DialogTitle>Edycja usługi</DialogTitle>
            <DialogDescription>Formularz z fixed header i footer.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <UILabel>Nazwa usługi</UILabel>
                <Input placeholder="np. Mycie zewnętrzne..." />
              </div>
              <div className="space-y-2">
                <UILabel>Opis</UILabel>
                <Textarea placeholder="Szczegółowy opis usługi..." rows={4} />
              </div>
              <div className="space-y-2">
                <UILabel>Kategoria</UILabel>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz kategorię..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a">Detailing</SelectItem>
                    <SelectItem value="b">Mycie</SelectItem>
                    <SelectItem value="c">Polerowanie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <UILabel>Cena (zł)</UILabel>
                  <Input type="number" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <UILabel>Czas (min)</UILabel>
                  <Input type="number" placeholder="60" />
                </div>
              </div>
              <div className="space-y-2">
                <UILabel>Uwagi dodatkowe</UILabel>
                <Textarea placeholder="Opcjonalne uwagi..." rows={3} />
              </div>
              <div className="space-y-2">
                <UILabel>Dodatkowe informacje</UILabel>
                <Textarea placeholder="Więcej tekstu żeby scrollować..." rows={6} />
              </div>
            </div>
          </div>
          <div className="shrink-0 flex gap-3 p-6 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setContentDialogOpen(false)}
            >
              Anuluj
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setContentDialogOpen(false);
                toast.success('Zapisano');
              }}
            >
              Zapisz
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- Fonts Tab ---
const FontsTab = () => (
  <div className="space-y-12">
    <Section title="Font Families">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>font-sans (DM Sans) — domyślny</Label>
          <p className="font-sans text-2xl">Ala ma kota, a kot ma Alę. 0123456789</p>
        </div>
        <div className="space-y-2">
          <Label>font-serif (Crimson Pro)</Label>
          <p className="font-serif text-2xl">Ala ma kota, a kot ma Alę. 0123456789</p>
        </div>
        <div className="space-y-2">
          <Label>font-mono (SF Mono)</Label>
          <p className="font-mono text-2xl">Ala ma kota, a kot ma Alę. 0123456789</p>
        </div>
      </div>
    </Section>

    <Section title="Nagłówki">
      <div className="space-y-4">
        <div className="space-y-1">
          <Label>text-4xl font-bold (h1)</Label>
          <h1 className="text-4xl font-bold">Nagłówek pierwszy</h1>
        </div>
        <div className="space-y-1">
          <Label>text-3xl font-bold (h1 mniejszy)</Label>
          <h1 className="text-3xl font-bold">Nagłówek główny</h1>
        </div>
        <div className="space-y-1">
          <Label>text-2xl font-semibold (h2)</Label>
          <h2 className="text-2xl font-semibold">Nagłówek sekcji</h2>
        </div>
        <div className="space-y-1">
          <Label>text-xl font-semibold (h3)</Label>
          <h3 className="text-xl font-semibold">Podsekcja</h3>
        </div>
        <div className="space-y-1">
          <Label>text-lg font-semibold (h4)</Label>
          <h4 className="text-lg font-semibold">Nagłówek mniejszy</h4>
        </div>
        <div className="space-y-1">
          <Label>text-base font-semibold (h5)</Label>
          <h5 className="text-base font-semibold">Etykieta sekcji</h5>
        </div>
      </div>
    </Section>

    <Section title="Tekst">
      <div className="space-y-4">
        <div className="space-y-1">
          <Label>text-base (body)</Label>
          <p className="text-base">
            Standardowy tekst akapitu używany w większości miejsc aplikacji. Prawidłowa typografia
            ułatwia czytanie i poprawia UX.
          </p>
        </div>
        <div className="space-y-1">
          <Label>text-sm (small)</Label>
          <p className="text-sm">Mniejszy tekst używany w opisach, podtytułach i formularzach.</p>
        </div>
        <div className="space-y-1">
          <Label>text-xs (caption)</Label>
          <p className="text-xs">Najmniejszy tekst — etykiety, timestamps, linki pomocnicze.</p>
        </div>
        <div className="space-y-1">
          <Label>text-sm text-muted-foreground (helper)</Label>
          <p className="text-sm text-muted-foreground">
            Tekst pomocniczy, podpowiedzi, opisy pól formularza.
          </p>
        </div>
      </div>
    </Section>

    <Section title="Font Weights">
      <div className="space-y-3">
        {(['font-normal', 'font-medium', 'font-semibold', 'font-bold'] as const).map((weight) => (
          <div key={weight} className="space-y-1">
            <Label>{weight}</Label>
            <p className={`text-lg ${weight}`}>Przykładowy tekst z wagą {weight}</p>
          </div>
        ))}
      </div>
    </Section>
  </div>
);

// --- Variables Tab ---
const VariablesTab = () => (
  <div className="space-y-12">
    {colorGroups.map((group) => (
      <Section key={group.title} title={group.title}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {group.colors.map((color) => (
            <ColorSwatch key={color.cssVar} name={color.name} cssVar={color.cssVar} />
          ))}
        </div>
      </Section>
    ))}

    <Section title="Border Radius">
      <div className="flex flex-wrap gap-4">
        {(
          [
            'rounded-none',
            'rounded-sm',
            'rounded',
            'rounded-md',
            'rounded-lg',
            'rounded-xl',
            'rounded-full',
          ] as const
        ).map((r) => (
          <div key={r} className="flex flex-col items-center gap-1.5">
            <div className={`w-16 h-16 bg-primary ${r}`} />
            <Label>{r}</Label>
          </div>
        ))}
      </div>
    </Section>

    <Section title="Shadows">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {(
          [
            'shadow-2xs',
            'shadow-xs',
            'shadow-sm',
            'shadow',
            'shadow-md',
            'shadow-lg',
            'shadow-xl',
            'shadow-2xl',
          ] as const
        ).map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <div className={`w-full h-20 bg-card rounded-lg ${s}`} />
            <Label>{s}</Label>
          </div>
        ))}
      </div>
    </Section>

    <Section title="Spacing (--spacing: 0.25rem)">
      <div className="space-y-3">
        {([1, 2, 3, 4, 6, 8, 12, 16] as const).map((n) => (
          <div key={n} className="flex items-center gap-3">
            <Label>{`p-${n}`}</Label>
            <div className="bg-primary/20 rounded">
              <div className={`bg-primary rounded h-4`} style={{ width: `${n * 4}px` }} />
            </div>
            <span className="text-xs text-muted-foreground">{n * 4}px</span>
          </div>
        ))}
      </div>
    </Section>
  </div>
);

// --- Main ---
const DesignSystem = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Design System</h1>
          <p className="text-muted-foreground mt-1">Podgląd reużywalnych komponentów UI</p>
        </div>

        <Tabs defaultValue="components">
          <TabsList>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="fonts">Fonts</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
          </TabsList>

          <TabsContent value="components" className="mt-8">
            <ComponentsTab />
          </TabsContent>
          <TabsContent value="fonts" className="mt-8">
            <FontsTab />
          </TabsContent>
          <TabsContent value="variables" className="mt-8">
            <VariablesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DesignSystem;
