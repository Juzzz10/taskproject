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
    // We now use sessionStorage so the user is logged out when the tab is closed
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
        sessionStorage.setItem('token', res.token); // Switched to sessionStorage
        this.isLoggedIn = true;
        this.loadAllTasks();
      },
      error: (err) => alert('Login failed: ' + (err.error?.message || 'Check your credentials'))
    });
  }

  register() {
    this.http.post('http://localhost:8000/api/register', this.registerData).subscribe({
      next: (res: any) => {
        sessionStorage.setItem('token', res.token); // Switched to sessionStorage
        this.isLoggedIn = true;
        this.loadAllTasks();
      },
      error: (err) => alert('Registration failed: ' + (err.error?.message || 'Check your data'))
    });
  }

  logout() {
    sessionStorage.removeItem('token'); // Switched to sessionStorage
    this.isLoggedIn = false;
    this.tasks = [];
    this.finishedTasks = [];
    this.deletedTasks = [];
  }

  // --- TASK LOGIC ---

  loadAllTasks() {
    this.todoService.getTasks().subscribe((data: Task[]) => {
      this.tasks = data.filter(t => !t.completedAt && !t.deletedAt);
      this.finishedTasks = data.filter(t => t.completedAt && !t.deletedAt);
      this.deletedTasks = data.filter(t => t.deletedAt);
    });
  }

  addTask() {
    if (!this.newTask.trim()) return;

    const taskData = {
      text: this.newTask,
      done: false
    };

    this.todoService.addTask(taskData).subscribe({
      next: (newTaskFromServer) => {
        this.tasks.push(newTaskFromServer);
        this.newTask = ''; 
      },
      error: (err) => {
        const message = err.error?.message || err.statusText || 'Unknown Error';
        alert('Failed to add task: ' + message);
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