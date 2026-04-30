import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonDatetime,
  IonButton,
  IonSpinner,
  IonToast,
  IonAlert,
  IonNote,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { addTask } from '../services/taskService';
import { scheduleReminder, requestPermission } from '../services/notificationService';
import { isFuture } from '../utils/dateHelper';

const AddTask: React.FC = () => {
  const history = useHistory();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueTime, setDueTime] = useState('');

  const [titleError, setTitleError] = useState<string | null>(null);
  const [dueTimeError, setDueTimeError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [showPermissionAlert, setShowPermissionAlert] = useState(false);

  const validate = (): boolean => {
    let valid = true;

    if (!title || title.trim() === '') {
      setTitleError('Title is required.');
      valid = false;
    } else {
      setTitleError(null);
    }

    if (!dueTime) {
      setDueTimeError('Due time is required.');
      valid = false;
    } else if (!isFuture(new Date(dueTime))) {
      setDueTimeError('Due time must be in the future.');
      valid = false;
    } else {
      setDueTimeError(null);
    }

    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const task = await addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        due_time: dueTime,
      });

      // Check notification permission before scheduling
      const permitted = await requestPermission();
      if (!permitted) {
        // Show alert explaining reminders won't fire; navigate after dismissal
        setShowPermissionAlert(true);
        setSaving(false);
        return;
      }

      await scheduleReminder(task);
      history.push('/home');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save task.';
      setToastMessage(msg);
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionAlertDismiss = async () => {
    setShowPermissionAlert(false);
    // Navigate to home without scheduling (permission denied)
    history.push('/home');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Add Task</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Add Task</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div style={{ padding: '16px' }}>
          {/* Title */}
          <IonItem
            lines="full"
            className={titleError ? 'ion-invalid' : ''}
            style={{ marginBottom: '4px' }}
          >
            <IonLabel position="stacked">
              Title <span style={{ color: 'var(--ion-color-danger)' }}>*</span>
            </IonLabel>
            <IonInput
              value={title}
              onIonInput={(e) => setTitle(e.detail.value ?? '')}
              placeholder="Enter task title"
              clearInput
            />
          </IonItem>
          {titleError && (
            <IonNote color="danger" style={{ paddingLeft: '16px', fontSize: '0.85rem' }}>
              {titleError}
            </IonNote>
          )}

          {/* Description */}
          <IonItem lines="full" style={{ marginTop: '12px', marginBottom: '4px' }}>
            <IonLabel position="stacked">Description (optional)</IonLabel>
            <IonTextarea
              value={description}
              onIonInput={(e) => setDescription(e.detail.value ?? '')}
              placeholder="Enter task description"
              rows={3}
              autoGrow
            />
          </IonItem>

          {/* Due Time */}
          <IonItem
            lines="full"
            className={dueTimeError ? 'ion-invalid' : ''}
            style={{ marginTop: '12px', marginBottom: '4px' }}
          >
            <IonLabel position="stacked">
              Due Time <span style={{ color: 'var(--ion-color-danger)' }}>*</span>
            </IonLabel>
            <IonDatetime
              presentation="date-time"
              value={dueTime || undefined}
              onIonChange={(e) => {
                const val = Array.isArray(e.detail.value)
                  ? e.detail.value[0]
                  : e.detail.value;
                setDueTime(val ?? '');
              }}
              min={new Date().toISOString()}
              style={{ width: '100%' }}
            />
          </IonItem>
          {dueTimeError && (
            <IonNote color="danger" style={{ paddingLeft: '16px', fontSize: '0.85rem' }}>
              {dueTimeError}
            </IonNote>
          )}

          {/* Submit */}
          <IonButton
            expand="block"
            onClick={handleSubmit}
            disabled={saving}
            style={{ marginTop: '24px' }}
          >
            {saving ? <IonSpinner name="crescent" /> : 'Save Task'}
          </IonButton>
        </div>

        {/* Permission denied alert */}
        <IonAlert
          isOpen={showPermissionAlert}
          header="Notifications Disabled"
          message="Notification permission was denied. Your task has been saved, but reminders will not be delivered."
          buttons={[
            {
              text: 'OK',
              handler: handlePermissionAlertDismiss,
            },
          ]}
          onDidDismiss={handlePermissionAlertDismiss}
        />

        {/* Error toast */}
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

export default AddTask;
