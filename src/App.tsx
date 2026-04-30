import React, { useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonSpinner,
  setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { homeOutline, addCircleOutline, barChartOutline } from 'ionicons/icons';
import { LocalNotifications } from '@capacitor/local-notifications';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

import Home from './pages/Home';
import AddTask from './pages/AddTask';
import TaskDetail from './pages/TaskDetail';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { useAuth } from './hooks/useAuth';

setupIonicReact();

const App: React.FC = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    const listenerPromise = LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (action) => {
        const taskId = action.notification.extra?.taskId;
        if (taskId) {
          window.location.href = `/task/${taskId}`;
        }
      }
    );

    return () => {
      listenerPromise.then((l) => l.remove());
    };
  }, []);

  // Show a full-screen spinner while Supabase resolves the session
  if (loading) {
    return (
      <IonApp>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <IonSpinner name="crescent" />
        </div>
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        {!user ? (
          // Unauthenticated: only show login, redirect everything else
          <IonRouterOutlet>
            <Route exact path="/login" component={Login} />
            <Route>
              <Redirect to="/login" />
            </Route>
          </IonRouterOutlet>
        ) : (
          // Authenticated: show full app with tabs
          <IonTabs>
            <IonRouterOutlet>
              <Route exact path="/home" component={Home} />
              <Route exact path="/add-task" component={AddTask} />
              <Route exact path="/task/:id" component={TaskDetail} />
              <Route exact path="/dashboard" component={Dashboard} />
              <Route exact path="/login">
                <Redirect to="/home" />
              </Route>
              <Route exact path="/">
                <Redirect to="/home" />
              </Route>
            </IonRouterOutlet>

            <IonTabBar slot="bottom">
              <IonTabButton tab="home" href="/home">
                <IonIcon icon={homeOutline} />
                <IonLabel>Home</IonLabel>
              </IonTabButton>

              <IonTabButton tab="add-task" href="/add-task">
                <IonIcon icon={addCircleOutline} />
                <IonLabel>Add Task</IonLabel>
              </IonTabButton>

              <IonTabButton tab="dashboard" href="/dashboard">
                <IonIcon icon={barChartOutline} />
                <IonLabel>Dashboard</IonLabel>
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
        )}
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
