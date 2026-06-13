import { apiClient } from './client';

export const uploadsApi = {
  uploadTournamentFlyer: (tournamentId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient
      .post<{ flyerUrl: string }>(`/uploads/tournament/${tournamentId}/flyer`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  uploadClubLogo: (clubId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient
      .post<{ logoUrl: string }>(`/uploads/club/${clubId}/logo`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};
