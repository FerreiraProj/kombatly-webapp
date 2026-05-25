export type UserRole = 'ADMIN' | 'PROMOTER' | 'CLUB' | 'ATHLETE' | 'REFEREE';
export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    countryCode?: string;
    language: string;
    role: UserRole;
    isActive: boolean;
    emailVerifiedAt?: string;
    createdAt: string;
    club?: ClubProfile;
}
export interface ClubProfile {
    id: string;
    name: string;
    sigla?: string;
    logoUrl?: string;
    city?: string;
    country?: string;
}
