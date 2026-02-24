export type ActivityNotificationType = 'withdrawal' | 'upgrade' | 'bonus' | 'general'

export interface ActivityNotification {
  id: string
  type: ActivityNotificationType
  message: string
}

export const homeActivityNotifications: ActivityNotification[] = [
  {
    id: 'diane-withdrawal',
    type: 'withdrawal',
    message: 'Diane abikuje 40,000 RWF mukanya gashize.',
  },
  {
    id: 'patrick-upgrade',
    type: 'upgrade',
    message: 'Patrick azamuye konti ye kuri Pro.',
  },
  {
    id: 'ange-bonus',
    type: 'bonus',
    message: 'Ange abonye bonus ya 40%.',
  },
  {
    id: 'sibomana-withdrawal',
    type: 'withdrawal',
    message: 'Sibomana abikuje 15,000 RWF aka kanya.',
  },
    {
    id: 'Uwera-upgrade',
    type: 'upgrade',
    message: 'Uwera azamuye konti ye kuri Pro.',
  },
  {
    id: 'Kabatesi-withdrawal',
    type: 'withdrawal',
    message: 'Kabatesi abikuje 20,000 RWF aka kanya.',
  },
  {
    id: 'Albine-withdrawal',
    type: 'withdrawal',
    message: 'Albine abikuje 8,000 RWF mu kanya gashize.',
  },
  {
    id: 'Jean-bonus',
    type: 'bonus',
    message: 'Jean abonye bonus ya 25%.',
  },
  {
    id: 'Diane-upgrade',
    type: 'upgrade',
    message: 'Diane azamuye konti ye kuri Pro Max.',
  },
  {
    id: 'Muhirwa-withdrawal',
    type: 'withdrawal',
    message: 'Muhirwa abikuje 50,000 RWF mu kanya gashize.',
  }
]
