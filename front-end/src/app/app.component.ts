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

  tasks: Task[] = []; 
  finishedTasks: Task[] = [];
  deletedTasks: Task[] = [];

  constructor(private todoService: TodoService, private http: HttpClient) {}

  ngOnInit(): void {
    const token = sessionStorage.getItem('token');
    if (token) { this.isLoggedIn = true; this.loadAllTasks(); }
  }

  login(): void {
    this.http.post('http://localhost:8000/api/auth/login', this.loginData).subscribe({
      next: (res: any) => {
        sessionStorage.setItem('token', res.token);
        this.isLoggedIn = true;
        this.loadAllTasks();
      },
      error: () => alert('Login failed')
    });
  }

  register(): void {
    this.http.post('http://localhost:8000/api/auth/register', this.registerData).subscribe({
      next: (res: any) => {
        sessionStorage.setItem('token', res.token);
        this.isLoggedIn = true;
        this.loadAllTasks();
      },
      error: (err) => {
        if (err.status === 422) alert('Email already exists');
        else alert('Registration failed');
      }
    });
  }

  logout(): void {
    // REVOKE TOKEN ON BACKEND
    this.http.post('http://localhost:8000/api/auth/logout', {}).subscribe({
      next: () => this.clearLocalSession(),
      error: () => this.clearLocalSession()
    });
  }

  private clearLocalSession(): void {
    sessionStorage.removeItem('token');
    this.isLoggedIn = false;
    this.tasks = []; this.finishedTasks = []; this.deletedTasks = [];
  }

  loadAllTasks(): void {
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

  startEdit(task: Task): void { task.tempText = task.text; task.isEditing = true; }
  cancelEdit(task: Task): void { task.isEditing = false; }
  saveEdit(task: Task): void {
    if (!task.tempText?.trim()) return;
    task.text = task.tempText;
    this.todoService.updateTask(task).subscribe(() => task.isEditing = false);
  }

  toggleDone(task: Task): void {
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

  clearHistory(): void {
    if (confirm('Clear history?')) {
      this.todoService.clearHistory().subscribe(() => {
        this.finishedTasks = []; this.deletedTasks = [];
      });
    }
  }

  get remainingTasks(): number { return this.tasks.filter(t => !t.done).length; }
  trackByFn(i: number, t: Task): number { return t.id; }
}