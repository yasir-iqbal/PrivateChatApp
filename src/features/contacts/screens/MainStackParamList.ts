export type MainStackParamList = {
  Chats: undefined;
  Contacts: undefined;
  NewChat: undefined;
  AddContact: undefined;
  Settings: undefined;
  ContactDetail: {
    contactUid: string;
    contactName: string;
    contactEmail: string;
    contactPhotoURL?: string | null;
  };
  Chat: { contactUid: string; contactName: string; contactPhotoURL?: string | null };
};
