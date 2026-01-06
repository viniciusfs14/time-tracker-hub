import { useState } from 'react';
import { PenLine, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTimeTracker } from '@/contexts/TimeTrackerContext';
import { toast } from 'sonner';

export function ManualEntry() {
  const { addManualEntry } = useTimeTracker();
  const [activity, setActivity] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activity.trim() || !startTime || !endTime) {
      toast.error('Preencha todos os campos');
      return;
    }

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (endMinutes <= startMinutes) {
      toast.error('Hora final deve ser maior que a hora inicial');
      return;
    }

    addManualEntry(activity, startTime, endTime);
    toast.success('Registro adicionado!');
    
    setActivity('');
    setStartTime('');
    setEndTime('');
  };

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
          <PenLine className="w-5 h-5 text-secondary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Registro Manual</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="manualActivity" className="text-sm font-medium">
            Atividade (inclua o código RITM se houver)
          </Label>
          <Input
            id="manualActivity"
            placeholder="Ex: Reunião com equipe [RITM001234]"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className="h-12"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime" className="text-sm font-medium">
              Início
            </Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime" className="text-sm font-medium">
              Fim
            </Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-12"
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-12 gap-2 text-base font-medium">
          <Plus className="w-5 h-5" />
          Lançar Registro
        </Button>
      </form>
    </div>
  );
}
