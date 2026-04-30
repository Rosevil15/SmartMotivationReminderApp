import React from 'react';
import { IonCard, IonCardContent, IonIcon } from '@ionic/react';
import { sparkles } from 'ionicons/icons';

interface MotivationBoxProps {
  message: string;
}

const MotivationBox: React.FC<MotivationBoxProps> = ({ message }) => {
  return (
    <IonCard
      style={{
        background: 'linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%)',
        color: 'var(--ion-color-primary-contrast)',
        margin: '16px',
        borderRadius: '12px',
      }}
    >
      <IonCardContent
        style={{
          textAlign: 'center',
          padding: '24px 16px',
        }}
      >
        <IonIcon
          icon={sparkles}
          style={{
            fontSize: '2rem',
            display: 'block',
            margin: '0 auto 12px auto',
            color: 'var(--ion-color-primary-contrast)',
          }}
        />
        <p
          style={{
            fontSize: '1.1rem',
            fontWeight: '600',
            lineHeight: '1.5',
            margin: 0,
            color: 'var(--ion-color-primary-contrast)',
          }}
        >
          {message}
        </p>
      </IonCardContent>
    </IonCard>
  );
};

export default MotivationBox;
