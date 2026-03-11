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
  title(title: any) {
    throw new Error('Method not implemented.');
  }
  // Authentication State
  isLoggedIn = false;
  showRegister = false;
  loginData = { email: '', password: '' };
  registerData = { name: '', email: '', password: '' };

  // Task Data
  newTask = '';
  tasks: any[] = []; // Used 'any' to allow 'isEditing' and 'tempText' UI properties
  finishedTasks: Task[] = [];
  deletedTasks: Task[] = [];

  constructor(private todoService: TodoService, private http: HttpClient) {}

  ngOnInit() {
    // sessionStorage ensures logout when the tab/browser is closed
    const token = sessionStorage.getItem('token');
    if (token) {
      this.isLoggedIn = true;
      this.loadAllTasks();
    }
  }

  // --- AUTHENTICATION LOGIC ---

  login() {
    this.http.post('http://localhost:8000/api/login', this.loginData).subscribe({
      next: (res: any) => {
        sessionStorage.setItem('token', res.token);
        this.isLoggedIn = true;
        this.loadAllTasks();
      },
      error: (err) => alert('Login failed: ' + (err.error?.message || 'Invalid credentials'))
    });
  }

  register() {
    this.http.post('http://localhost:8000/api/register', this.registerData).subscribe({
      next: (res: any) => {
        sessionStorage.setItem('token', res.token);
        this.isLoggedIn = true;
        this.loadAllTasks();
      },
      error: (err) => alert('Registration failed: ' + (err.error?.message || 'Email already exists'))
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
      this.tasks = data.filter(t => !t.completedAt && !t.deletedAt);
      this.finishedTasks = data.filter(t => t.completedAt && !t.deletedAt);
      this.deletedTasks = data.filter(t => t.deletedAt);
    });
  }

  addTask() {
    if (!this.newTask.trim()) return;
    const taskData = { text: this.newTask, done: false };

    this.todoService.addTask(taskData).subscribe({
      next: (newTask) => {
        this.tasks.push(newTask);
        this.newTask = '';
      },
      error: (err) => alert('Failed to add task: ' + err.statusText)
    });
  }

  // --- INLINE EDIT LOGIC ---

  startEdit(task: any) {
    task.tempText = task.text;
    task.isEditing = true;
  }

  cancelEdit(task: any) {
    task.isEditing = false;
    task.tempText = '';
  }

  saveEdit(task: any) {
    if (!task.tempText.trim()) return;
    const originalText = task.text;
    task.text = task.tempText;

    this.todoService.updateTask(task).subscribe({
      next: () => {
        task.isEditing = false;
        task.tempText = '';
      },
      error: () => {
        task.text = originalText; // Revert on error
        alert('Update failed');
      }
    });
  }

  // --- STATUS UPDATES ---

  toggleDone(task: Task) {
    // task.done is updated by ngModel automatically
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
    this.finishedTasks = [];
    this.deletedTasks = [];
  }

  get remainingTasks() {
    return this.tasks.filter(t => !t.done).length;
  }

  trackByFn(index: number, item: Task) {
    return item.id;
  }
}