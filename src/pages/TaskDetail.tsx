import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonButton,
  IonToast,
  IonBadge,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/react';
import { checkmarkCircle, timeOutline, flameOutline } from 'ionicons/icons';
import { Task } from '../types';
import { getTask, markDone } from '../services/taskService';
import { cancelReminder } from '../services/notificationService';
import { formatDueTime } from '../utils/dateHelper';

interface TaskDetailParams {
  id: string;
}

const TaskDetail: React.FC = () => {
  const { id } = useParams<TaskDetailParams>();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getTask(id);
        setTask(data);
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleMarkDone = async () => {
    if (!task) return;

    // Optimistic update
    const previous = task;
    setTask({ ...task, status: 'done' });

    try {
      const updated = await markDone(task.id);
      setTask(updated);
      await cancelReminder(task.id);
    } catch (err) {
      // Revert on failure
      setTask(previous);
      const msg = err instanceof Error ? err.message : 'Failed to mark task as done.';
      setToastMessage(msg);
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Task Detail</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Task Detail</IonTitle>
          </IonToolbar>
        </IonHeader>

        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '60vh',
            }}
          >
            <IonSpinner name="crescent" />
          </div>
        ) : notFound || !task ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '1.1rem', color: 'var(--ion-color-medium)', marginBottom: '16px' }}>
              Task not found.
            </p>
            <IonBackButton defaultHref="/home" text="Go Back" />
          </div>
        ) : (
          <div style={{ padding: '16px' }}>
            <IonCard>
              <IonCardHeader>
                <IonCardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IonIcon
                    icon={task.status === 'done' ? checkmarkCircle : timeOutline}
                    color={task.status === 'done' ? 'success' : 'warning'}
                    style={{ fontSize: '1.4rem' }}
                  />
                  {task.title}
                </IonCardTitle>
              </IonCardHeader>

              <IonCardContent>
                {/* Description */}
                <div style={{ marginBottom: '16px' }}>
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--ion-color-medium)',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Description
                  </p>
                  <p style={{ margin: 0, color: task.description ? 'inherit' : 'var(--ion-color-medium)', fontStyle: task.description ? 'normal' : 'italic' }}>
                    {task.description || 'No description'}
                  </p>
                </div>

                {/* Due Time */}
                <div style={{ marginBottom: '16px' }}>
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--ion-color-medium)',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Due Time
                  </p>
                  <p style={{ margin: 0 }}>{formatDueTime(task.due_time)}</p>
                </div>

                {/* Status */}
                <div style={{ marginBottom: '16px' }}>
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--ion-color-medium)',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Status
                  </p>
                  <IonBadge color={task.status === 'done' ? 'success' : 'warning'}>
                    {task.status}
                  </IonBadge>
                </div>

                {/* Streak */}
                <div style={{ marginBottom: '16px' }}>
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--ion-color-medium)',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Streak
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IonIcon icon={flameOutline} color="warning" />
                    <span>{task.streak} day{task.streak !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Mark as Done button — only shown when pending */}
                {task.status === 'pending' && (
                  <IonButton
                    expand="block"
                    color="success"
                    onClick={handleMarkDone}
                    style={{ marginTop: '8px' }}
                  >
                    <IonIcon icon={checkmarkCircle} slot="start" />
                    Mark as Done
                  </IonButton>
                )}
              </IonCardContent>
            </IonCard>
          </div>
        )}

        <IonToast
          isOpen={showToast}
          message={toastMessage ?? ''}
          duration={3000}
          color="danger"
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default TaskDetail;
