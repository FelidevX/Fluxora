import { Rol } from "./rol";

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  password?: string;
  rol: Rol;
}
