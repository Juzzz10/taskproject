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
  tasks: any[] = []; 
  finishedTasks: Task[] = [];
  deletedTasks: Task[] = [];

  constructor(private todoService: TodoService, private http: HttpClient) {}

  ngOnInit() {
    // Check for session token on refresh
    const token = sessionStorage.getItem('token');
    if (token) {
      this.isLoggedIn = true;
      this.loadAllTasks();
    }
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

  logout() {
    sessionStorage.removeItem('token');
    this.isLoggedIn = false;
    this.tasks = [];
    this.finishedTasks = [];
    this.deletedTasks = [];
  }

  // --- TASK CRUD LOGIC ---

  loadAllTasks() {
    this.todoService.getTasks().subscribe((data: Task[]) => {
      // 1. Active: Not finished AND Not deleted
      this.tasks = data.filter(t => !t.completedAt && !t.deletedAt);
      
      // 2. Finished: Has completedAt AND Not deleted
      this.finishedTasks = data.filter(t => t.completedAt && !t.deletedAt);
      
      // 3. Deleted: Has deletedAt timestamp
      this.deletedTasks = data.filter(t => t.deletedAt !== null && t.deletedAt !== undefined);
    });
  }

  addTask() {
    if (!this.newTask.trim()) return;
    const taskData = { text: this.newTask, done: false };

    this.todoService.addTask(taskData).subscribe({
      next: (newTask) => {
        this.tasks.push(newTask);
        this.newTask = '';
      }
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

    this.todoService.updateTask(task).subscribe({
      next: () => task.isEditing = false,
      error: () => {
        task.text = originalText;
        alert('Update failed');
      }
    });
  }

  // --- STATUS UPDATES ---

  toggleDone(task: Task) {
    task.completedAt = task.done ? new Date().toLocaleString() : undefined;
    this.todoService.updateTask(task).subscribe();
  }

  deleteTask(task: Task) {
    task.deletedAt = new Date().toLocaleString();
    this.todoService.updateTask(task).subscribe(() => {
      this.tasks = this.tasks.filter(t => t.id !== task.id);
      this.deletedTasks.push(task);
    });
  }

  moveToFinished(task: Task) {
    if (!task.done) return;
    task.completedAt = new Date().toLocaleString();
    this.todoService.updateTask(task).subscribe(() => {
      this.tasks = this.tasks.filter(t => t.id !== task.id);
      this.finishedTasks.push(task);
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

  trackByFn(index: number, item: Task) {
    return item.id;
  }
}