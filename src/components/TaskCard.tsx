import React from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonBadge,
  IonIcon,
} from '@ionic/react';
import { checkmarkCircle, timeOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Task } from '../types';
import { formatDueTime } from '../utils/dateHelper';

interface TaskCardProps {
  task: Task;
  onMarkDone: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onMarkDone }) => {
  const history = useHistory();

  const handleCardClick = () => {
    history.push(`/task/${task.id}`);
  };

  const handleMarkDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkDone(task.id);
  };

  const statusIcon = task.status === 'done' ? checkmarkCircle : timeOutline;
  const statusColor = task.status === 'done' ? 'success' : 'warning';

  return (
    <IonCard button onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <IonCardHeader>
        <IonCardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IonIcon
            icon={statusIcon}
            color={statusColor}
            style={{ fontSize: '1.2rem' }}
          />
          {task.title}
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p style={{ margin: '0 0 8px 0', color: 'var(--ion-color-medium)' }}>
          {formatDueTime(task.due_time)}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <IonBadge color={statusColor}>{task.status}</IonBadge>
          {task.status === 'pending' && (
            <IonButton
              size="small"
              color="primary"
              onClick={handleMarkDone}
            >
              Mark as Done
            </IonButton>
          )}
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default TaskCard;
