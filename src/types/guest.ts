export interface Guest {
  id: number;
  name: string;
  title?: string;
  phone_number?: string;
  card_class_id: number;
  invite_code: string;
  qr_code_path?: string;
  qr_code_base64?: string;
  guest_card_path?: string;
  rsvp_status: "Yes" | "No" | "Maybe" | "Pending";
  card_class?: {
    id: number;
    name: string;
    max_guests: number;
  };
} 