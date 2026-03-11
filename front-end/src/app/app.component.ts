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

  // Task Data (Explicitly typed to avoid 'never' error)
  newTask = '';
  tasks: Task[] = [];
  finishedTasks: Task[] = [];
  deletedTasks: Task[] = [];

  constructor(private todoService: TodoService, private http: HttpClient) {}

  ngOnInit() {
    // Check if user is already logged in on refresh
    const token = localStorage.getItem('token');
    if (token) {
      this.isLoggedIn = true;
      this.loadAllTasks();
    }
  }

  // --- AUTHENTICATION LOGIC ---

  login() {
    this.http.post('http://localhost:8000/api/login', this.loginData).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);
        this.isLoggedIn = true;
        this.loadAllTasks();
      },
      error: (err) => alert('Login failed: ' + err.error.message)
    });
  }

  register() {
    this.http.post('http://localhost:8000/api/register', this.registerData).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);
        this.isLoggedIn = true;
        this.loadAllTasks();
      },
      error: (err) => alert('Registration failed: ' + err.error.message)
    });
  }

  logout() {
    localStorage.removeItem('token');
    this.isLoggedIn = false;
    this.tasks = [];
    this.finishedTasks = [];
    this.deletedTasks = [];
  }

  // --- TASK LOGIC ---

  loadAllTasks() {
    this.todoService.getTasks().subscribe((data: Task[]) => {
      // Sort tasks into categories based on their properties
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
      this.newTask = ''; // Clear the input on success
    },
    error: (err) => {
      console.error(err);
      // This will pop up a window telling you exactly what Laravel said
      const message = err.error?.message || err.statusText || 'Unknown Error';
      alert('Failed to add task: ' + message);
    }
  });
}

  toggleDone(task: Task) {
    // Note: task.done is already updated by ngModel in HTML
    task.completedAt = task.done ? new Date().toLocaleString() : undefined;
    this.todoService.updateTask(task).subscribe();
  }

  deleteTask(task: Task) {
    task.deletedAt = new Date().toLocaleString();
    this.todoService.updateTask(task).subscribe(() => {
      // Move from active list to deleted list in UI
      this.tasks = this.tasks.filter(t => t.id !== task.id);
      this.deletedTasks.push(task);
    });
  }

  moveToFinished(task: Task) {
    if (!task.done) return;
    
    task.completedAt = new Date().toLocaleString();
    this.todoService.updateTask(task).subscribe(() => {
      // Move from active list to finished list in UI
      this.tasks = this.tasks.filter(t => t.id !== task.id);
      this.finishedTasks.push(task);
    });
  }

  clearHistory() {
    // For now, we clear the local UI arrays. 
    // In a full app, you would send a DELETE request to the server for these tasks.
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