import React, { useState, useEffect, useRef } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSpinner,
  IonToast,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  useIonViewWillEnter,
} from '@ionic/react';
import { Task } from '../types';
import { fetchTasks } from '../services/taskService';
import { computeDashboardStats } from '../utils/dashboardStats';
import BadgeDisplay from '../components/BadgeDisplay';

const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [badgeToast, setBadgeToast] = useState<string | null>(null);
  const [showBadgeToast, setShowBadgeToast] = useState(false);

  // Track previously earned badge milestones to detect newly earned ones
  const prevEarnedMilestonesRef = useRef<Set<number>>(new Set());

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await fetchTasks();
      setTasks(data);

      // Check for newly earned badges
      const stats = computeDashboardStats(data);
      const currentEarned = new Set(
        stats.badges.filter((b) => b.earned).map((b) => b.milestone)
      );

      const prev = prevEarnedMilestonesRef.current;
      for (const badge of stats.badges) {
        if (badge.earned && !prev.has(badge.milestone)) {
          // New badge earned
          setBadgeToast(`🏆 New badge earned: ${badge.label}!`);
          setShowBadgeToast(true);
          break; // Show one toast at a time
        }
      }

      prevEarnedMilestonesRef.current = currentEarned;
    } catch {
      // Silently fail — stats will show empty state
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

  const stats = computeDashboardStats(tasks);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Dashboard</IonTitle>
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
          <div style={{ padding: '8px' }}>
            {/* Stats Grid */}
            <IonGrid>
              <IonRow>
                <IonCol size="6">
                  <IonCard style={{ textAlign: 'center', margin: '4px' }}>
                    <IonCardHeader>
                      <IonCardTitle style={{ fontSize: '2rem', color: 'var(--ion-color-primary)' }}>
                        {stats.totalTasks}
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <p style={{ margin: 0, color: 'var(--ion-color-medium)', fontSize: '0.85rem' }}>
                        Total Tasks
                      </p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="6">
                  <IonCard style={{ textAlign: 'center', margin: '4px' }}>
                    <IonCardHeader>
                      <IonCardTitle style={{ fontSize: '2rem', color: 'var(--ion-color-success)' }}>
                        {stats.completedTasks}
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <p style={{ margin: 0, color: 'var(--ion-color-medium)', fontSize: '0.85rem' }}>
                        Completed
                      </p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="6">
                  <IonCard style={{ textAlign: 'center', margin: '4px' }}>
                    <IonCardHeader>
                      <IonCardTitle style={{ fontSize: '2rem', color: 'var(--ion-color-warning)' }}>
                        {stats.currentStreak}
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <p style={{ margin: 0, color: 'var(--ion-color-medium)', fontSize: '0.85rem' }}>
                        Current Streak 🔥
                      </p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="6">
                  <IonCard style={{ textAlign: 'center', margin: '4px' }}>
                    <IonCardHeader>
                      <IonCardTitle style={{ fontSize: '2rem', color: 'var(--ion-color-tertiary)' }}>
                        {stats.motivationScore}%
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <p style={{ margin: 0, color: 'var(--ion-color-medium)', fontSize: '0.85rem' }}>
                        Motivation Score
                      </p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonGrid>

            {/* Badges Section */}
            <IonCard style={{ margin: '8px 4px' }}>
              <IonCardHeader>
                <IonCardTitle>Badges</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <BadgeDisplay badges={stats.badges} />
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* New badge earned toast */}
        <IonToast
          isOpen={showBadgeToast}
          message={badgeToast ?? ''}
          duration={4000}
          color="warning"
          position="top"
          onDidDismiss={() => setShowBadgeToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
