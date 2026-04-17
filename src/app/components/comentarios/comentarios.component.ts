import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ApiService, Comentario } from '../../services/api.service';

@Component({
  selector: 'app-comentarios',
  templateUrl: './comentarios.component.html',
  styleUrl: './comentarios.component.css'
})
export class ComentariosComponent implements OnInit {

  comentarios: Comentario[] = [];
  comentariosFiltrados: Comentario[] = [];
  cargando = true;
  enviando = false;
  mensajeExito = '';
  mensajeError = '';
  busqueda = '';
  eliminandoId: number | null = null;
  confirmandoId: number | null = null;

  paginaActual = 1;
  porPagina = 20;

  nuevoComentario: Comentario = { name: '', email: '', body: '' };

  // Paleta de colores para avatares
  private avatarColors = [
    'linear-gradient(135deg,#667eea,#764ba2)',
    'linear-gradient(135deg,#f093fb,#f5576c)',
    'linear-gradient(135deg,#4facfe,#00f2fe)',
    'linear-gradient(135deg,#43e97b,#38f9d7)',
    'linear-gradient(135deg,#fa709a,#fee140)',
    'linear-gradient(135deg,#a18cd1,#fbc2eb)',
    'linear-gradient(135deg,#fccb90,#d57eeb)',
    'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
    'linear-gradient(135deg,#fd7043,#ff8a65)',
    'linear-gradient(135deg,#26c6da,#00acc1)',
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.cargarComentarios();
  }

  cargarComentarios(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.apiService.getComentarios().subscribe({
      next: (data) => {
        this.comentarios = data;
        this.aplicarFiltro();
        this.cargando = false;
      },
      error: () => {
        this.mensajeError = 'Error al cargar comentarios.';
        this.cargando = false;
      }
    });
  }

  aplicarFiltro(): void {
    const q = this.busqueda.toLowerCase().trim();
    this.comentariosFiltrados = q
      ? this.comentarios.filter(c =>
          c.name.toLowerCase().includes(q) ||
          c.body.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
        )
      : [...this.comentarios];
    this.paginaActual = 1;
  }

  get paginados(): Comentario[] {
    const inicio = (this.paginaActual - 1) * this.porPagina;
    return this.comentariosFiltrados.slice(inicio, inicio + this.porPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.comentariosFiltrados.length / this.porPagina);
  }

  get paginas(): number[] {
    const total = this.totalPaginas;
    const actual = this.paginaActual;
    const inicio = Math.max(1, actual - 2);
    const fin   = Math.min(total, actual + 2);
    const rango: number[] = [];
    for (let i = inicio; i <= fin; i++) rango.push(i);
    return rango;
  }

  irPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas) this.paginaActual = p;
  }

  getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return this.avatarColors[Math.abs(hash) % this.avatarColors.length];
  }

  enviarComentario(form: NgForm): void {
    if (form.invalid) return;
    this.enviando = true;
    this.mensajeExito = '';
    this.mensajeError = '';

    const fecha = new Date().toLocaleDateString('es-PE', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const payload: Comentario = { ...this.nuevoComentario, postId: 1, fecha };

    this.apiService.postComentario(payload).subscribe({
      next: () => {
        const nuevo: Comentario = { ...payload, id: Date.now() };
        this.comentarios.unshift(nuevo);
        this.aplicarFiltro();
        this.mensajeExito = '✅ ¡Comentario publicado exitosamente!';
        this.enviando = false;
        form.resetForm();
        this.nuevoComentario = { name: '', email: '', body: '' };
        setTimeout(() => this.mensajeExito = '', 4000);
      },
      error: () => {
        this.mensajeError = '❌ Error al publicar. Intente nuevamente.';
        this.enviando = false;
      }
    });
  }

  solicitarEliminar(id: number): void  { this.confirmandoId = id; }
  cancelarEliminar(): void             { this.confirmandoId = null; }

  confirmarEliminar(id: number): void {
    this.eliminandoId = id;
    this.confirmandoId = null;
    this.apiService.deleteComentario(id).subscribe({
      next: () => this.quitarLocal(id),
      error: () => this.quitarLocal(id) // JSONPlaceholder simula el DELETE
    });
  }

  private quitarLocal(id: number): void {
    this.comentarios = this.comentarios.filter(c => c.id !== id);
    this.aplicarFiltro();
    this.eliminandoId = null;
    if (this.paginaActual > this.totalPaginas && this.totalPaginas > 0) {
      this.paginaActual = this.totalPaginas;
    }
  }

  get totalComentarios(): number { return this.comentarios.length; }
  get totalFiltrados(): number   { return this.comentariosFiltrados.length; }
  get hayFiltro(): boolean       { return this.busqueda.trim().length > 0; }
}
