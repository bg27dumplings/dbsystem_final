export type CreateMarketplaceItemInput = {
  studentId: number;
  title: string;
  categoryId: string;
  conditionLabel: string;
  location: string;
  quantity: string;
  locationX: string;
  locationY: string;
  exchangeMode: string;
  exchangeValue: string;
  description: string;
  images: File[];
};

export type CreateMarketplaceItemField =
  | "title"
  | "categoryId"
  | "conditionLabel"
  | "location"
  | "quantity"
  | "exchangeMode"
  | "exchangeValue"
  | "description"
  | "images";

export type CreateMarketplaceItemFieldErrors = Partial<Record<CreateMarketplaceItemField, string>>;

export type CreateMarketplaceItemResult =
  | {
      ok: true;
      itemId: string;
    }
  | {
      ok: false;
      fieldErrors: CreateMarketplaceItemFieldErrors;
      formError: string;
    };

export type ValidatedMarketplaceItemInput = {
  studentId: number;
  title: string;
  categoryId: number;
  conditionLabel: string;
  location: string;
  quantity: number;
  locationX: number | null;
  locationY: number | null;
  exchangeMode: "price" | "treat_drink" | "treat_food" | "free" | "custom";
  exchangeLabel: string;
  exchangeValue: string | null;
  originalPrice: number;
  salePrice: number | null;
  exchangeNote: string;
  description: string;
  images: File[];
};
