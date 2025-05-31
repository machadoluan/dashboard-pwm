export interface Client {
    id?: number;
    nome: string;
    telefone: string;
    endereco: string;
    tags: string[];
    sinal: boolean;
}