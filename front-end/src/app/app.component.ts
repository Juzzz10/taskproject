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
  isLoggedIn = false;
  showRegister = false;
  loginData = { email: '', password: '' };
  registerData = { name: '', email: '', password: '' };

  newTask = '';
  tasks: any[] = []; 
  finishedTasks: Task[] = [];
  deletedTasks: Task[] = [];

  constructor(private todoService: TodoService, private http: HttpClient) {}

  ngOnInit() {
    const token = sessionStorage.getItem('token');
    if (token) {
      this.isLoggedIn = true;
      this.loadAllTasks();
    }
  }

  login() {
    this.http.post('http://localhost:8000/api/login', this.loginData).subscribe({
      next: (res: any) => {
        sessionStorage.setItem('token', res.token);
        this.isLoggedIn = true;
        this.loadAllTasks();
      },
      error: (err) => alert('Login failed')
    });
  }

  register() {
    this.http.post('http://localhost:8000/api/register', this.registerData).subscribe({
      next: (res: any) => {
        sessionStorage.setItem('token', res.token);
        this.isLoggedIn = true;
        this.loadAllTasks();
      },
      error: (err) => alert('Registration failed')
    });
  }

  logout() {
    sessionStorage.removeItem('token');
    this.isLoggedIn = false;
    this.tasks = [];
    this.finishedTasks = [];
    this.deletedTasks = [];
  }

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
  // Confirm with the user first
  if (confirm('Are you sure you want to permanently clear all history?')) {
    this.todoService.clearHistory().subscribe({
      next: () => {
        // Only clear the UI arrays if the database deletion was successful
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