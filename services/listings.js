// Shared listing helpers — single source of truth for turning a web-backend
// Listing (Mongo shape) into the shape the screens render, and for resolving
// stored image paths to full URLs. Previously duplicated across StudentHome,
// MyListings and AdminListings.

import { BASE_URL } from './api';

// Resolve a stored image path (e.g. "uploads/listings/x.jpg") to a full URL.
// Cloudinary uploads are already absolute https URLs and pass through unchanged.
export const resolveImageUrl = (u) => {
  if (!u) return null;
  if (u.startsWith('http') || u.startsWith('data:')) return u;
  return `${BASE_URL}/${String(u).replace(/^\/+/, '').replace(/\\/g, '/')}`;
};

// Map a web-backend Listing (Mongo) into the shape the UI expects.
export const normalizeListing = (l) => {
  if (!l) return l;
  const landlord = l.landlordId && typeof l.landlordId === 'object' ? l.landlordId : null;
  const university = l.universityId && typeof l.universityId === 'object' ? l.universityId : null;
  const images = (l.imageUrls || l.images || []).map(resolveImageUrl).filter(Boolean);
  const location = l.address
    ? [l.address.street, l.address.city].filter(Boolean).join(', ')
    : (l.location || '');
  return {
    ...l,
    id: l._id || l.id,
    location,
    images,
    imageUrls: images,
    createdAt: l.createdAt ? new Date(l.createdAt).getTime() : null,
    // landlordId may be populated as an object; expose the id string + display name.
    landlordId: landlord ? landlord._id : l.landlordId,
    landlordName: landlord ? landlord.name : undefined,
    landlordEmail: landlord ? landlord.email : undefined,
    universityName: university ? university.name : undefined,
  };
};
