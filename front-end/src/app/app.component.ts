import { Component, OnInit } from '@angular/core';
import { Task } from './models/task.model';
import { TodoService } from './services/todo.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  
  // Authentication State
  isLoggedIn = false;
  showRegister = false;
  loginData = { email: '', password: '' };
  registerData = { name: '', email: '', password: '' };

  // Task Data
  newTask = '';

  tasks: Task[] = []; 
  finishedTasks: Task[] = [];
  deletedTasks: Task[] = [];

  constructor(private todoService: TodoService, private http: HttpClient) {}

  ngOnInit() {
    // Check for session token on refresh
    const token = sessionStorage.getItem('token');
    if (token) { this.isLoggedIn = true; this.loadAllTasks(); }
  }

  // --- AUTHENTICATION LOGIC ---

  login() {
    // Updated URL with /auth/ prefix
    this.http.post('http://localhost:8000/api/auth/login', this.loginData).subscribe({
      next: (res: any) => {
        sessionStorage.setItem('token', res.token);
        this.isLoggedIn = true;
        this.loadAllTasks();
      },
      error: (err) => {
        const msg = err.status === 401 ? 'Invalid email or password' : 'Login failed: Server error';
        alert(msg);
      }
    });
  }

  register() {
    // Updated URL with /auth/ prefix
    this.http.post('http://localhost:8000/api/auth/register', this.registerData).subscribe({
      next: (res: any) => {
        sessionStorage.setItem('token', res.token);
        this.isLoggedIn = true;
        this.loadAllTasks();
      },
      error: (err) => {
        // Handle Laravel validation errors (specifically duplicate email)
        if (err.status === 422) {
          const errors = err.error.errors;
          if (errors && errors.email) {
            alert('Email already exists');
          } else {
            alert('Registration failed: Please check your details');
          }
        } else {
          alert('Registration failed: Server error');
        }
      }
    });
  }

  private clearLocalSession(): void {
    sessionStorage.removeItem('token');
    this.isLoggedIn = false;
    this.tasks = []; this.finishedTasks = []; this.deletedTasks = [];
  }

  // --- TASK CRUD LOGIC ---

  loadAllTasks() {
    this.todoService.getTasks().subscribe((data: Task[]) => {
      // Filter the data into three separate lists
      this.tasks = data.filter(t => !t.completedAt && !t.deletedAt);
      this.finishedTasks = data.filter(t => !!t.completedAt && !t.deletedAt);
      this.deletedTasks = data.filter(t => !!t.deletedAt);
    });
  }

  addTask(): void {
    if (!this.newTask.trim()) return;
    this.todoService.addTask({ text: this.newTask, done: false }).subscribe((task: Task) => {
      this.tasks.push(task);
      this.newTask = '';
    });
  }

  // --- INLINE EDIT LOGIC ---

  startEdit(task: any) {
    task.tempText = task.text;
    task.isEditing = true;
  }

  cancelEdit(task: any) {
    task.isEditing = false;
  }

  saveEdit(task: any) {
    if (!task.tempText.trim()) return;
    const originalText = task.text;
    task.text = task.tempText;
    this.todoService.updateTask(task).subscribe(() => task.isEditing = false);
  }

  // --- STATUS UPDATES ---

  toggleDone(task: Task) {
    task.completedAt = task.done ? new Date().toLocaleString() : undefined;
    this.todoService.updateTask(task).subscribe();
  }

  deleteTask(task: Task): void {
    this.todoService.deleteTask(task.id).subscribe(() => {
        this.loadAllTasks(); // Reload to move to history
    });
  }

  moveToFinished(task: Task): void {
    task.completedAt = new Date().toLocaleString();
    this.todoService.updateTask(task).subscribe(() => {
      this.loadAllTasks(); // Reload to move to history
    });
  }

  clearHistory() {
    if (confirm('Are you sure you want to permanently clear all history?')) {
      this.todoService.clearHistory().subscribe({
        next: () => {
          this.finishedTasks = [];
          this.deletedTasks = [];
        },
        error: (err) => {
          alert('Failed to clear history from database');
          console.error(err);
        }
      });
    }
  }

  get remainingTasks() {
    return this.tasks.filter(t => !t.done).length;
  }

  get remainingTasks(): number { return this.tasks.filter(t => !t.done).length; }
  trackByFn(i: number, t: Task): number { return t.id; }
}