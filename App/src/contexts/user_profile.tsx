'use client';

import { createContext, useContext } from 'react';

export type UserProfileType = {
    first_name: string;
    last_name: string;
    email: string;
    account_type: string;
    avatar_url: string;
};

const UserProfileContext = createContext<UserProfileType | null>(null);

export function useUserProfile() {
    return useContext(UserProfileContext);
}

export function UserProfileProvider({
    userProfile,
    children,
}: {
    userProfile: UserProfileType | null;
    children: React.ReactNode;
}) {
    return (
        <UserProfileContext.Provider value={userProfile}>{children}</UserProfileContext.Provider>
    );
}
