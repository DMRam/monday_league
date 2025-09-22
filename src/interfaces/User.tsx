export interface TeamUser {
    name: string;
    email: string;
    password: string
    role: 'admin' | 'referee' | 'player';
    team: string
}