import { Clock, BarChart3, StickyNote, Link2, CalendarDays } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimersPanel } from '@/components/TimersPanel';
import { ManualEntry } from '@/components/ManualEntry';
import { RitmManager } from '@/components/RitmManager';
import { StatsPanel } from '@/components/StatsPanel';
import { CalendarPanel } from '@/components/CalendarPanel';
import { NotesPanel } from '@/components/NotesPanel';
import { UsefulLinksPanel } from '@/components/UsefulLinksPanel';

export function EmployeeDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Meu registro</h1>
          <p className="text-muted-foreground">Gerencie suas atividades diárias</p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="timer" className="space-y-6">
        <TabsList className="bg-muted/50 flex-wrap h-auto">
          <TabsTrigger value="timer" className="gap-2">
            <Clock className="w-4 h-4" />
            Cronômetro
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            📝 Manual
          </TabsTrigger>
          <TabsTrigger value="ritm" className="gap-2">
            💼 Chamados
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Estatísticas
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarDays className="w-4 h-4" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <StickyNote className="w-4 h-4" />
            Notas
          </TabsTrigger>
          <TabsTrigger value="links" className="gap-2">
            <Link2 className="w-4 h-4" />
            Links Úteis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="mt-0">
          <TimersPanel />
        </TabsContent>

        <TabsContent value="manual" className="mt-0">
          <ManualEntry />
        </TabsContent>

        <TabsContent value="ritm" className="mt-0">
          <RitmManager />
        </TabsContent>

        <TabsContent value="stats" className="mt-0">
          <StatsPanel />
        </TabsContent>

        <TabsContent value="calendar" className="mt-0">
          <CalendarPanel />
        </TabsContent>

        <TabsContent value="notes" className="mt-0">
          <NotesPanel />
        </TabsContent>

        <TabsContent value="links" className="mt-0">
          <UsefulLinksPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
