"use client";
import { useCallback, useEffect, useState } from "react";

const API_URL = '/api';

interface User {
  _id?: string;
  userId?: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  avatarUrl?: string;
}

interface Project {
  _id: string;
  name: string;
  description?: string;
  status: "active" | "completed";
}

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [deletingProfile, setDeletingProfile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectError, setProjectError] = useState("");

  // Fetch the authenticated user's profile.
  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/users/me`, {
        method: "GET",
        credentials: "include",
      });
      if (response.status === 401 || response.status === 403) {
        window.location.href = "/";
        return;
      }
      if (!response.ok) {
        throw new Error("Unable to load your profile.");
      }
      const data: User = await response.json();
      setUser(data);
      setEditName(data.name ?? "");
      setEditEmail(data.email ?? "");
    } catch (error) {
      console.error("Profile request failed:", error);
      setErrorMessage("Unable to load your profile.");
    } finally {
      setLoadingUser(false);
    }
  }, []);

  // Fetch projects belonging to the authenticated user.
  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: "GET",
        credentials: "include",
      });
      if (response.status === 401 || response.status === 403) {
        window.location.href = "/";
        return;
      }
      if (!response.ok) {
        throw new Error("Unable to load your projects.");
      }
      const data = await response.json();
      setProjects(Array.isArray(data.projects) ? data.projects : []);
    } catch (error) {
      console.error("Projects request failed:", error);
      setErrorMessage("Unable to load your projects.");
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  // Initialize the clock and load dashboard data.
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    void fetchUser();
    void fetchProjects();
    return () => window.clearInterval(timer);
  }, [fetchUser, fetchProjects]);

  const formattedDate = currentTime
    ? currentTime.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Loading date...";

  const formattedTime = currentTime
    ? currentTime.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--";

  // Update the user's details.
  async function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");
    if (!editName.trim()) {
      setErrorMessage("Name cannot be empty.");
      return;
    }
    if (!editEmail.trim()) {
      setErrorMessage("Email cannot be empty.");
      return;
    }
    if (newPassword && newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    const updates: {
      name: string;
      email: string;
      password?: string;
    } = {
      name: editName.trim(),
      email: editEmail.trim(),
    };
    if (newPassword) {
      updates.password = newPassword;
    }
    try {
      setSavingProfile(true);
      const response = await fetch(`${API_URL}/users/me`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update your profile.");
      }
      setUser(data);
      setEditName(data.name ?? "");
      setEditEmail(data.email ?? "");
      setNewPassword("");
      setConfirmPassword("");
      setShowProfileSettings(false);
      setMessage("Your profile was updated successfully.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating your profile."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  // Logout
  const handleLogout = async () => {
    setLoggingOut(true);
    setErrorMessage("");
    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Logout failed. Please try again.");
      }
      window.location.href = "/";
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to log out."
      );
      setLoggingOut(false);
    }
  };

  // Delete the authenticated account.
  const handleDeleteProfile = async () => {
    setDeletingProfile(true);
    setErrorMessage("");
    try {
      const response = await fetch(`${API_URL}/users/me`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Unable to delete your account.");
      }
      window.location.href = "/";
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete your account."
      );
      setDeletingProfile(false);
    }
  };

  // Create new project
  const handleCreateProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!projectName.trim()) {
      setProjectError("Project name is required.");
      return;
    }

    setCreatingProject(true);
    setProjectError("");

    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName.trim(),
          description: projectDescription.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Unable to create project."
        );
      }

      setProjectName("");
      setProjectDescription("");
      setShowProjectForm(false);
      await fetchProjects();
    } catch (error) {
      console.error("Project creation failed", error);
      setProjectError(
        error instanceof Error ? error.message : "Unable to create project."
      );
    } finally {
      setCreatingProject(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0F19] px-5 py-6 text-white sm:px-8 lg:px-12">
      {/* HEADER */}
      <header className="mx-auto flex max-w-7xl items-center justify-between border-b border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-wide">
            Project<span className="text-green-400">ly</span>
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Your workspace, your progress.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:border-red-400 hover:text-red-400 disabled:opacity-50"
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </header>

      <div className="mx-auto mt-8 max-w-7xl">
        {/* USER INFORMATION */}
        <section className="rounded-2xl border border-green-400/20 bg-[#111827] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                {loadingUser
                  ? "Welcome back! 👋"
                  : `Welcome back${user?.name ? `, ${user.name}` : ""} 👋`}
              </h2>
            </div>
            <div className="rounded-xl border border-gray-700 bg-[#0B0F19] p-5 sm:min-w-64">
              <p className="text-sm text-gray-400">Today</p>
              <p className="mt-2 font-medium">{formattedDate}</p>
              <p className="mt-2 text-xl font-semibold text-green-400">
                {formattedTime}
              </p>
            </div>
          </div>
        </section>

        {/* FEEDBACK MESSAGES */}
        {message && (
          <div
            role="status"
            className="mt-5 rounded-lg border border-green-400/20 bg-green-400/10 p-4 text-sm text-green-300"
          >
            {message}
          </div>
        )}
        {errorMessage && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300"
          >
            {errorMessage}
          </div>
        )}

        {/* PROJECTS SECTION */}
        <section className="mt-8">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold">My Projects</h2>
              <p className="mt-2 text-sm text-gray-400">
                All your projects in one place. Select one to view and add tasks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setProjectError("");
                setShowProjectForm((current) => !current);
              }}
              className="rounded-lg bg-green-500 px-5 py-3 font-semibold text-gray-950 transition hover:bg-green-400"
            >
              {showProjectForm ? "Cancel" : "+ New Project"}
            </button>
          </div>

          {showProjectForm && (
            <form
              onSubmit={handleCreateProject}
              className="mb-6 space-y-4 rounded-2xl border border-gray-800 bg-[#111827] p-6"
            >
              <h2 className="text-xl font-semibold">Create a New Project</h2>
              <div>
                <label
                  htmlFor="project-name"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Project Name
                </label>
                <input
                  id="project-name"
                  type="text"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="e.g. Portfolio Website"
                  required
                  className="w-full rounded-lg border border-gray-700 bg-[#0B0F19] px-4 py-3 text-white outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label
                  htmlFor="project-description"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Description
                </label>
                <textarea
                  id="project-description"
                  value={projectDescription}
                  onChange={(event) => setProjectDescription(event.target.value)}
                  placeholder="What is this project about?"
                  rows={3}
                  className="w-full rounded-lg border border-gray-700 bg-[#0B0F19] px-4 py-3 text-white outline-none focus:border-green-500"
                />
              </div>
              {projectError && (
                <p className="text-sm text-red-400">{projectError}</p>
              )}
              <button
                type="submit"
                disabled={creatingProject || !projectName.trim()}
                className="rounded-lg bg-green-500 px-5 py-3 font-semibold text-gray-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingProject ? "Creating..." : "Create Project"}
              </button>
            </form>
          )}

          {loadingProjects ? (
            <div className="rounded-2xl border border-gray-800 bg-[#111827] p-10 text-center">
              <p className="text-gray-400">Loading your projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl border border-gray-800 bg-[#111827] p-8 text-center sm:p-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-green-400/20 bg-green-400/10">
                <span className="text-3xl text-green-400">+</span>
              </div>
              <h3 className="mt-5 text-xl font-semibold">No projects yet</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-400">
                Create your first project to organise your work, add tasks, and
                track your progress.
              </p>
              <button
                type="button"
                onClick={() => setShowProjectForm(true)}
                className="mt-6 rounded-lg bg-green-400 px-5 py-3 font-semibold text-gray-950 transition hover:bg-green-300"
              >
                Create your first project
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <article
                  key={project._id}
                  className="rounded-2xl border border-gray-800 bg-[#111827] p-6 transition hover:border-green-400/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold">{project.name}</h3>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                        project.status === "completed"
                          ? "bg-green-400/10 text-green-400"
                          : "bg-blue-400/10 text-blue-400"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <p className="mt-3 min-h-12 text-sm leading-6 text-gray-400">
                    {project.description || "No description provided."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `/projects/${project._id}`;
                    }}
                    className="mt-5 text-sm font-semibold text-green-400 transition hover:text-green-300"
                  >
                    Open project →
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ACCOUNT SETTINGS */}
        <section className="mt-8 rounded-2xl border border-gray-800 bg-[#111827] p-6">
          <h2 className="text-lg font-semibold">Account Settings</h2>
          <p className="mt-2 text-sm text-gray-400">
            Update your profile or permanently remove your account.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setErrorMessage("");
                setMessage("");
                setEditName(user?.name ?? "");
                setEditEmail(user?.email ?? "");
                setNewPassword("");
                setConfirmPassword("");
                setShowProfileSettings(!showProfileSettings);
              }}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:border-green-400 hover:text-green-400"
            >
              {showProfileSettings ? "Close Settings" : "Profile Settings"}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirmation(true)}
              className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 transition hover:border-red-500 hover:bg-red-500/10"
            >
              Delete Profile
            </button>
          </div>

          {/* PROFILE EDIT FORM */}
          {showProfileSettings && (
            <form
              onSubmit={handleSaveProfile}
              className="mt-6 max-w-xl space-y-5 border-t border-gray-800 pt-6"
            >
              <h3 className="text-lg font-semibold">Edit Your Profile</h3>
              <div>
                <label
                  htmlFor="profile-name"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  required
                  minLength={4}
                  className="w-full rounded-lg border border-gray-700 bg-[#0B0F19] px-4 py-3 text-white outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label
                  htmlFor="profile-email"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Email
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={editEmail}
                  onChange={(event) => setEditEmail(event.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-700 bg-[#0B0F19] px-4 py-3 text-white outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label
                  htmlFor="profile-new-password"
                  className="mb-2 block text-sm text-gray-300"
                >
                  New Password
                </label>
                <input
                  id="profile-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="Leave blank to keep current password"
                  className="w-full rounded-lg border border-gray-700 bg-[#0B0F19] px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-green-400"
                />
              </div>
              <div>
                <label
                  htmlFor="profile-confirm-password"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Confirm New Password
                </label>
                <input
                  id="profile-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-700 bg-[#0B0F19] px-4 py-3 text-white outline-none focus:border-green-400"
                />
              </div>
              <button
                type="submit"
                disabled={savingProfile || !editName.trim() || !editEmail.trim()}
                className="rounded-lg bg-green-400 px-5 py-3 font-semibold text-gray-950 transition hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </form>
          )}
        </section>

        {/* DELETE PROFILE CONFIRMATION */}
        {showDeleteConfirmation && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5"
            onClick={() => {
              if (!deletingProfile) {
                setShowDeleteConfirmation(false);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-profile-title"
              className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#111827] p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <h2
                id="delete-profile-title"
                className="text-xl font-bold text-red-400"
              >
                Delete your profile?
              </h2>
              <p className="mt-4 text-sm leading-6 text-gray-300">
                This action is permanent. Your account, projects, and tasks will
                be deleted. You will not be able to recover them.
              </p>
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  disabled={deletingProfile}
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:border-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingProfile}
                  onClick={handleDeleteProfile}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50"
                >
                  {deletingProfile ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className="py-8 text-center text-sm text-gray-500">
          Projectly · Plan your work. Track your progress.
        </footer>
      </div>
    </main>
  );
}
