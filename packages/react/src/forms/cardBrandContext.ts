import { createContext } from 'react';
import type { CardBrand } from './cardFormat';

/**
 * Set by CardFields: the brand its number field recognises, which the security code field reads
 * for its length. `undefined` outside a group, where the code field takes a `brand` prop instead.
 */
export const CardBrandContext = createContext<CardBrand | null | undefined>(undefined);
