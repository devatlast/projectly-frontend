"use client";

import { FormEvent,Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface Project {
  _id: string;
  name: string;
  description?: string;
  status: "active" | "completed";
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  projectId?: string;
  createdAt?: string;
}

function ProjectPageContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = Array.isArray(params?.id)
    ? params.id[0]
    : (params?.id as string);

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [creatingTask, setCreatingTask] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [taskError, setTaskError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchProject = useCallback(async () => {
    setLoadingProject(true);
    setErrorMessage("");
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}`, {
        method: "GET",
        credentials: "include",
      });
      if (response.status === 401 || response.status === 403) {
        router.push("/");
        return;
      }
      if (!response.ok) {
        throw new Error("Unable to load this project.");
      }
      const data = await response.json();
      const selectedProject = data.project ?? data;
      if (!selectedProject?._id) {
        throw new Error("The project response was not in the expected format.");
      }
      setProject(selectedProject);
    } catch (error) {
      console.error("Project request failed:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load this project."
      );
    } finally {
      setLoadingProject(false);
    }
  }, [projectId, router]);

  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    setTaskError("");
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/tasks`, {
        method: "GET",
        credentials: "include",
      });
      if (response.status === 401 || response.status === 403) {
        router.push("/");
        return;
      }
      if (!response.ok) {
        throw new Error("Unable to load this project's tasks.");
      }
      const data = await response.json();
      const taskList = Array.isArray(data) ? data : data.tasks;
      if (!Array.isArray(taskList)) {
        throw new Error("The tasks response was not in the expected format.");
      }
      setTasks(taskList);
    } catch (error) {
      console.error("Tasks request failed:", error);
      setTaskError(
        error instanceof Error
          ? error.message
          : "Unable to load this project's tasks."
      );
    } finally {
      setLoadingTasks(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    void fetchProject();
    void fetchTasks();
  }, [fetchProject, fetchTasks]);

  // Create task
  async function handleCreateTask(event: FormEvent) {
    event.preventDefault();
    setCreatingTask(true);
    setTaskError("");
    setSuccessMessage("");
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/tasks`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description,
          priority,
        }),
      });
      if (response.status === 401 || response.status === 403) {
        router.push("/");
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Unable to create the task."
        );
      }
      setTitle("");
      setDescription("");
      setPriority("medium");
      setShowTaskForm(false);
      setSuccessMessage("Task created successfully.");
      await fetchTasks();
    } catch (error) {
      console.error("Task creation failed:", error);
      setTaskError(
        error instanceof Error ? error.message : "Unable to create the task."
      );
    } finally {
      setCreatingTask(false);
    }
  }

  // Update task status or priority
  async function handleUpdateTask(
    taskId: string,
    updates: Partial<Pick<Task, "status" | "priority">>
  ) {
    setUpdatingTaskId(taskId);
    setTaskError("");
    setSuccessMessage("");
    try {
      const response = await fetch(
        `${API_URL}/projects/${projectId}/tasks/${taskId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        }
      );
      if (response.status === 401 || response.status === 403) {
        router.push("/");
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Unable to update the task."
        );
      }
      const data = await response.json().catch(() => ({}));
      const updatedTask = data.task ?? data;
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task._id === taskId ? { ...task, ...updatedTask, ...updates } : task
        )
      );
      setSuccessMessage("Task updated successfully.");
    } catch (error) {
      console.error("Task update failed:", error);
      setTaskError(
        error instanceof Error ? error.message : "Unable to update the task."
      );
    } finally {
      setUpdatingTaskId(null);
    }
  }

  // Delete task
  async function handleDeleteTask() {
    if (!taskToDelete) return;
    const taskId = taskToDelete._id;
    setDeletingTaskId(taskId);
    setTaskError("");
    setSuccessMessage("");
    try {
      const response = await fetch(
        `${API_URL}/projects/${projectId}/tasks/${taskId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (response.status === 401 || response.status === 403) {
        router.push("/");
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Unable to delete the task."
        );
      }
      setTasks((currentTasks) =>
        currentTasks.filter((task) => task._id !== taskId)
      );
      setTaskToDelete(null);
      setSuccessMessage("Task deleted successfully.");
    } catch (error) {
      console.error("Task deletion failed:", error);
      setTaskError(
        error instanceof Error ? error.message : "Unable to delete the task."
      );
    } finally {
      setDeletingTaskId(null);
    }
  }

  // Delete project
  const handleDeleteProject = async () => {
    setDeletingProject(true);
    setDeleteError("");
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.status === 401 || response.status === 403) {
        router.push("/");
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Failed to delete project."
        );
      }
      router.push("/dashboard");
    } catch (error) {
      console.error("Delete project error:", error);
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting this project."
      );
      setDeletingProject(false);
    }
  };

  // Change project status
  async function handleStatusChange(newStatus: Project["status"]) {
    if (!project || newStatus === project.status) {
      return;
    }
    setUpdatingStatus(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });
      if (response.status === 401 || response.status === 403) {
        router.push("/");
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to update the project status.");
      }
      const data = await response.json().catch(() => ({}));
      const updatedProject = data.project ?? data;
      setProject((currentProject) =>
        currentProject
          ? {
              ...currentProject,
              ...updatedProject,
              status: newStatus,
            }
          : currentProject
      );
      setSuccessMessage("Project status updated successfully.");
    } catch (error) {
      console.error("Project status update failed:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update the project status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (loadingProject) {
    return (
      <main className="min-h-screen bg-[#0B0F19] p-6 text-white sm:p-10">
        <p className="text-gray-400">Loading project…</p>
      </main>
    );
  }

  if (errorMessage && !project) {
    return (
      <main className="min-h-screen bg-[#0B0F19] p-6 text-white sm:p-10">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-6 text-green-400 hover:text-green-300"
        >
          ← Back to Dashboard
        </button>
        <p className="text-red-400">{errorMessage}</p>
        <button
          type="button"
          onClick={() => void fetchProject()}
          className="mt-4 rounded-lg bg-[#111827] px-4 py-2 hover:bg-gray-800"
        >
          Try Again
        </button>
      </main>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#0B0F19] p-6 text-white sm:p-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-lg px-4 py-2 text-sm text-gray-400 transition hover:text-green-400"
          >
            ← Back to Dashboard
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteError("");
              setShowDeleteConfirmation(true);
            }}
            className="rounded-lg border border-red-500/40 px-5 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
          >
            Delete Project
          </button>
        </div>

        <section className="rounded-2xl border border-gray-800 bg-[#111827] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <p className="mb-2 text-sm text-green-400">PROJECT DETAILS</p>
              <h1 className="break-words text-3xl font-bold sm:text-4xl">
                {project.name}
              </h1>
              <p className="mt-3 whitespace-pre-wrap text-gray-400">
                {project.description || "No project description provided."}
              </p>
              {project.createdAt && (
                <p className="mt-4 text-xs text-gray-500">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="shrink-0">
              <label
                htmlFor="project-status"
                className="mb-2 block text-sm text-gray-400"
              >
                Project status
              </label>
              <select
                id="project-status"
                value={project.status}
                disabled={updatingStatus}
                onChange={(event) =>
                  void handleStatusChange(event.target.value as Project["status"])
                }
                className="w-full rounded-lg border border-gray-700 bg-[#0B0F19] px-4 py-3 text-sm outline-none transition focus:border-green-500 disabled:opacity-50 sm:w-auto"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
              {updatingStatus && (
                <p className="mt-2 text-xs text-gray-500">Updating status...</p>
              )}
            </div>
          </div>
        </section>

        {errorMessage && project && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-900 bg-red-950/30 p-3 text-sm text-red-400"
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mt-4 rounded-lg border border-green-900 bg-green-950/30 p-3 text-sm text-green-400"
          >
            {successMessage}
          </div>
        )}

        <section className="mt-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Tasks</h2>
              <p className="mt-1 text-sm text-gray-400">
                Manage the work belonging to this project.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setTaskError("");
                setSuccessMessage("");
                setShowTaskForm((current) => !current);
              }}
              className="rounded-lg bg-green-500 px-5 py-3 text-sm font-semibold text-gray-950 transition hover:bg-green-400"
            >
              {showTaskForm ? "Cancel" : "+ Add Task"}
            </button>
          </div>

          {showTaskForm && (
            <form
              onSubmit={handleCreateTask}
              className="mb-6 space-y-4 rounded-2xl border border-gray-800 bg-[#111827] p-6"
            >
              <h3 className="text-lg font-semibold">Create a task</h3>
              <div>
                <label
                  htmlFor="task-title"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Task title
                </label>
                <input
                  id="task-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Build the authentication page"
                  required
                  className="w-full rounded-lg border border-gray-700 bg-[#0B0F19] px-4 py-3 text-sm outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label
                  htmlFor="task-description"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Description
                </label>
                <textarea
                  id="task-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe what needs to be done..."
                  rows={3}
                  className="w-full resize-y rounded-lg border border-gray-700 bg-[#0B0F19] px-4 py-3 text-sm outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label
                  htmlFor="task-priority"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Priority
                </label>
                <select
                  id="task-priority"
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value as Task["priority"])
                  }
                  className="w-full rounded-lg border border-gray-700 bg-[#0B0F19] px-4 py-3 text-sm outline-none focus:border-green-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              {taskError && <p className="text-sm text-red-400">{taskError}</p>}
              <button
                type="submit"
                disabled={creatingTask || !title.trim()}
                className="rounded-lg bg-green-500 px-5 py-3 text-sm font-semibold text-gray-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingTask ? "Creating task..." : "Create Task"}
              </button>
            </form>
          )}

          {taskError && !showTaskForm && !taskToDelete && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-900 bg-red-950/30 p-3 text-sm text-red-400"
            >
              {taskError}
              <button
                type="button"
                onClick={() => void fetchTasks()}
                className="ml-3 underline hover:text-red-300"
              >
                Retry
              </button>
            </div>
          )}

          {loadingTasks ? (
            <div className="rounded-xl border border-gray-800 bg-[#111827] p-8 text-center text-gray-400">
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-700 bg-[#111827] px-6 py-12 text-center">
              <h3 className="text-lg font-semibold">No tasks yet</h3>
              <p className="mt-2 text-sm text-gray-400">
                Add your first task to start organizing this project.
              </p>
              <button
                type="button"
                onClick={() => setShowTaskForm(true)}
                className="mt-5 rounded-lg border border-green-500/50 px-4 py-2 text-sm text-green-400 transition hover:bg-green-500/10"
              >
                + Create your first task
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <article
                  key={task._id}
                  className="rounded-xl border border-gray-800 bg-[#111827] p-5 transition hover:border-gray-700 sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-lg font-semibold">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-400">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTaskError("");
                        setTaskToDelete(task);
                      }}
                      disabled={deletingTaskId === task._id}
                      className="w-fit rounded-lg border border-red-500/40 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Delete Task
                    </button>
                  </div>
                  <div className="mt-5 grid gap-4 border-t border-gray-800 pt-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`priority-${task._id}`}
                        className="mb-2 block text-xs text-gray-500"
                      >
                        Priority
                      </label>
                      <select
                        id={`priority-${task._id}`}
                        value={task.priority}
                        disabled={updatingTaskId === task._id}
                        onChange={(event) =>
                          void handleUpdateTask(task._id, {
                            priority: event.target.value as Task["priority"],
                          })
                        }
                        className="w-full rounded-lg border border-gray-700 bg-[#0B0F19] px-3 py-2.5 text-sm text-white outline-none transition focus:border-green-500 disabled:opacity-50"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor={`status-${task._id}`}
                        className="mb-2 block text-xs text-gray-500"
                      >
                        Status
                      </label>
                      <select
                        id={`status-${task._id}`}
                        value={task.status}
                        disabled={updatingTaskId === task._id}
                        onChange={(event) =>
                          void handleUpdateTask(task._id, {
                            status: event.target.value as Task["status"],
                          })
                        }
                        className="w-full rounded-lg border border-gray-700 bg-[#0B0F19] px-3 py-2.5 text-sm text-white outline-none transition focus:border-green-500 disabled:opacity-50"
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                  {updatingTaskId === task._id && (
                    <p className="mt-3 text-xs text-gray-500">
                      Saving changes...
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* DELETE PROJECT CONFIRMATION */}
      {showDeleteConfirmation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5"
          onClick={() => {
            if (!deletingProject) setShowDeleteConfirmation(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
            className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#111827] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="delete-project-title"
              className="text-xl font-bold text-red-400"
            >
              Delete this project?
            </h2>
            <p className="mt-4 text-sm leading-6 text-gray-300">
              This action is permanent. The project and all its tasks will be
              deleted. You will not be able to recover them.
            </p>
            {deleteError && (
              <p role="alert" className="mt-4 text-sm text-red-400">
                {deleteError}
              </p>
            )}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={deletingProject}
                onClick={() => setShowDeleteConfirmation(false)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:border-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingProject}
                onClick={handleDeleteProject}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50"
              >
                {deletingProject ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE TASK CONFIRMATION */}
      {taskToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5"
          onClick={() => {
            if (!deletingTaskId) setTaskToDelete(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-task-title"
            className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#111827] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-task-title" className="text-xl font-bold text-red-400">
              Delete this task?
            </h2>
            <p className="mt-4 break-words text-sm leading-6 text-gray-300">
              Are you sure you want to delete &ldquo;{taskToDelete.title}
              &rdquo;? This action cannot be undone.
            </p>
            {taskError && (
              <p role="alert" className="mt-4 text-sm text-red-400">
                {taskError}
              </p>
            )}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={deletingTaskId === taskToDelete._id}
                onClick={() => setTaskToDelete(null)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:border-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingTaskId === taskToDelete._id}
                onClick={() => void handleDeleteTask()}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
              >
                {deletingTaskId === taskToDelete._id
                  ? "Deleting..."
                  : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
export default function ProjectPage(){
  return (
    <Suspense fallback={<div>Loading project......</div>}>
    <ProjectPageContent/>
    </Suspense>
  )
}
