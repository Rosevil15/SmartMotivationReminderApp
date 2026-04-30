import React from 'react';
import { IonChip, IonIcon, IonLabel } from '@ionic/react';
import { flame, star, trophy } from 'ionicons/icons';
import { Badge } from '../types';

interface BadgeDisplayProps {
  badges: Badge[];
}

function getIconForMilestone(milestone: 3 | 7 | 30): string {
  switch (milestone) {
    case 3:
      return flame;
    case 7:
      return star;
    case 30:
      return trophy;
    default:
      return trophy;
  }
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ badges }) => {
  const earnedBadges = badges.filter((b) => b.earned);

  if (earnedBadges.length === 0) {
    return (
      <p
        style={{
          color: 'var(--ion-color-medium)',
          textAlign: 'center',
          fontStyle: 'italic',
          margin: '8px 0',
        }}
      >
        No badges yet
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px 0' }}>
      {earnedBadges.map((badge) => (
        <IonChip key={badge.milestone} color="warning">
          <IonIcon icon={getIconForMilestone(badge.milestone)} />
          <IonLabel>{badge.label}</IonLabel>
        </IonChip>
      ))}
    </div>
  );
};

export default BadgeDisplay;
