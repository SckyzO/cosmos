import type { LabelsInput } from '../labels/LabelsProvider';

// The French an app would give LabelsProvider for the chat components, for the stories that check
// they write what it says. Stories only, not part of the package.
export const FRENCH_CHAT: LabelsInput = {
  chatbot: {
    title: 'Assistant virtuel',
    you: 'Vous',
    launcher: 'Ouvrir le chat',
    launcherUnread: (launcher, count) => `${launcher}, ${count} non lu${count > 1 ? 's' : ''}`,
    close: 'Fermer le chat',
    conversationWith: (title) => `Conversation avec ${title}`,
    retry: 'Réessayer',
  },
  chatComposer: {
    field: 'Votre message',
    placeholder: 'Écrire un message…',
    send: 'Envoyer le message',
    stop: 'Arrêter la génération',
  },
  chatConversationList: {
    label: 'Conversations',
    unread: (count) => `${count} non ${count <= 1 ? 'lu' : 'lus'}`,
    online: 'en ligne',
    away: 'absent',
    offline: 'hors ligne',
  },
  chatMessage: {
    sending: 'Envoi en cours',
    sent: 'Envoyé',
    delivered: 'Remis',
    read: 'Lu',
    failed: 'Non envoyé',
  },
  chatMessageActions: {
    actions: 'Actions sur la réponse',
    copy: 'Copier la réponse',
    copied: 'Copié',
    regenerate: 'Régénérer',
    goodResponse: 'Bonne réponse',
    badResponse: 'Mauvaise réponse',
  },
  chatSources: { label: 'Sources', newTab: '(s’ouvre dans un nouvel onglet)' },
  chatSuggestions: { label: 'Réponses suggérées' },
  chatThread: { label: 'Discussion' },
  chatToolCall: {
    running: 'En cours',
    failed: 'Échec',
    done: 'Terminé',
    doneIn: (duration) => `Terminé en ${duration}`,
    input: 'Entrée',
    output: 'Sortie',
  },
  chatTypingIndicator: { typing: (name) => `${name} est en train d’écrire` },
};
