import { client } from '@/lib/rpc';

export interface Book {
  ISBN: string;
  bookName: string;
  author: string;
  publisher: string;
  publishDate: string;
  category: string;
  price: number;
  totalStock: number;
  availableStock: number;
  description: string | null;
  coverImage: string | null;
  status: string;
  createdAt: string;
}

export interface CreateBookInput {
  ISBN: string;
  bookName: string;
  author: string;
  publisher: string;
  publishDate: string;
  category: string;
  price: number;
  totalStock: number;
  availableStock: number;
  description?: string;
  coverImage?: string;
}

export const listBooksQuery = {
  queryKey: ['books'],
  queryFn: async () => {
    const res = await client.books.$get();
    const json = await res.json();
    return json.data;
  },
};

export const createBookMutation = {
  mutationFn: async (bookData: CreateBookInput) => {
    await client.books.$post({
      json: bookData,
    });
  },
};
