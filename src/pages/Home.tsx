import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonSpinner,
  IonToast,
  IonButton,
  IonFab,
  IonFabButton,
  IonIcon,
  useIonViewWillEnter,
} from '@ionic/react';
import { add } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Task } from '../types';
import { fetchTasks, markDone } from '../services/taskService';
import { cancelReminder } from '../services/notificationService';
import { getMessage } from '../services/motivationEngine';
import TaskCard from '../components/TaskCard';
import MotivationBox from '../components/MotivationBox';

const Home: React.FC = () => {
  const history = useHistory();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load tasks.';
      setErrorMessage(msg);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useIonViewWillEnter(() => {
    loadTasks();
  });

  const handleMarkDone = async (id: string) => {
    // Optimistic update
    const previous = tasks;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'done' as const } : t))
    );

    try {
      await markDone(id);
      await cancelReminder(id);
    } catch (err) {
      // Revert on failure
      setTasks(previous);
      const msg = err instanceof Error ? err.message : 'Failed to mark task as done.';
      setErrorMessage(msg);
      setShowError(true);
    }
  };

  const motivationMessage = getMessage({
    streak: tasks.length > 0 ? Math.max(...tasks.map((t) => t.streak)) : 0,
    doneTasks: tasks.filter((t) => t.status === 'done').length,
    overdueTasks: tasks.filter(
      (t) => t.status === 'pending' && new Date(t.due_time) < new Date()
    ).length,
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>My Tasks</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">My Tasks</IonTitle>
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
        ) : (
          <>
            <MotivationBox message={motivationMessage} />

            {tasks.length === 0 ? (
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
                <p
                  style={{
                    fontSize: '1.1rem',
                    color: 'var(--ion-color-medium)',
                    marginBottom: '16px',
                  }}
                >
                  No tasks yet! Add your first task.
                </p>
                <IonButton onClick={() => history.push('/add-task')}>
                  Add Task
                </IonButton>
              </div>
            ) : (
              <IonList>
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onMarkDone={handleMarkDone}
                  />
                ))}
              </IonList>
            )}
          </>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push('/add-task')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonToast
          isOpen={showError}
          message={errorMessage ?? ''}
          duration={3000}
          color="danger"
          onDidDismiss={() => setShowError(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
