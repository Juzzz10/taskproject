import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Task } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TodoService {
  private url = 'http://localhost:8000/api/tasks';

  constructor(private http: HttpClient) {}

  getTasks() { return this.http.get<Task[]>(this.url); }
  
  addTask(task: any) { return this.http.post<Task>(this.url, task); }

  updateTask(task: Task) { return this.http.put(`${this.url}/${task.id}`, task); }

  deleteTask(id: number) { return this.http.delete(`${this.url}/${id}`); }
  
}