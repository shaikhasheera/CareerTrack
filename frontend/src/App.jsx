
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [savedAuth] = useState(() =>
      JSON.parse(localStorage.getItem("careertrackAuth") || "null")
  );

  const [user, setUser] = useState(savedAuth?.user || null);
  const [token, setToken] = useState(savedAuth?.token || null);

  const [page, setPage] = useState("login");
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  const [authForm, setAuthForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const [applications, setApplications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const [form, setForm] = useState({
    companyName: "",
    jobRole: "",
    location: "",
    status: "Applied",
    appliedDate: "",
  });

  const [editProfile, setEditProfile] = useState(false);
  const [profileName, setProfileName] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const getErrorMessage = async (response, fallback) => {
    const data = await response.json().catch(() => null);
    return data?.detail || data?.message || fallback;
  };

  // Fetch applications
  useEffect(() => {
    if (user && token) {
      fetch(`${API_URL}/api/applications`, {
        headers: getAuthHeaders(),
      })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to load applications.");
            }
            return response.json();
          })
          .then((data) => setApplications(data))
          .catch((error) => alert(error.message));
    }
  }, [user, token]);

  // Login and registration
  const handleAuth = async (e) => {
    e.preventDefault();

    const email = authForm.email.trim();
    const fullName = authForm.fullName.trim();

    if (page === "register" && !fullName) {
      alert("Please enter your full name.");
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    if (!authForm.password) {
      alert("Please enter your password.");
      return;
    }

    const endpoint = page === "login" ? "login" : "register";

    try {
      const response = await fetch(
          `${API_URL}/api/users/${endpoint}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fullName,
              email,
              password: authForm.password,
            }),
          }
      );

      if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                page === "login"
                    ? "Invalid email or password."
                    : "Registration failed. Email may already exist."
            )
        );
      }

      const data = await response.json();

      if (page === "register") {
        setAuthForm({
          fullName: "",
          email,
          password: "",
        });

        setPage("login");
        alert("Registration successful! Please log in.");
        return;
      }

      const loggedInUser = {
        id: data.id,
        fullName: data.fullName,
        email: data.email,
      };

      setUser(loggedInUser);
      setToken(data.token);
      setProfileName(loggedInUser.fullName);
      setActiveMenu("Dashboard");

      localStorage.setItem(
          "careertrackAuth",
          JSON.stringify({
            user: loggedInUser,
            token: data.token,
          })
      );

      setAuthForm({
        fullName: "",
        email: "",
        password: "",
      });

      setPage("dashboard");
    } catch (error) {
      alert(error.message);
    }
  };

  // Forgot password - Send OTP
  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!forgotEmail.trim()) {
      setResetMessage("Please enter your registered email.");
      return;
    }

    setResetLoading(true);
    setResetMessage("");

    try {
      const response = await fetch(
          `${API_URL}/api/users/forgot-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: forgotEmail.trim(),
            }),
          }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
              "Account does not exist. Please register first."
          );
        }

        throw new Error(
            data?.detail ||
            data?.message ||
            "Unable to send OTP. Please try again."
        );
      }

      setPage("verifyOtp");
      setResetMessage(
          data?.message || "OTP sent. Please check your email."
      );
    } catch (error) {
      setResetMessage(error.message);
    } finally {
      setResetLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(otp.trim())) {
      setResetMessage("Please enter a valid 6-digit OTP.");
      return;
    }

    setResetLoading(true);
    setResetMessage("");

    try {
      const response = await fetch(
          `${API_URL}/api/users/verify-otp`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: forgotEmail.trim(),
              otp: otp.trim(),
            }),
          }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
            data?.detail ||
            data?.message ||
            "OTP verification failed."
        );
      }

      setPage("resetPassword");
      setResetMessage(
          data?.message || "OTP verified successfully."
      );
    } catch (error) {
      setResetMessage(error.message);
    } finally {
      setResetLoading(false);
    }
  };

  // Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      setResetMessage(
          "Password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetMessage("Passwords do not match.");
      return;
    }

    setResetLoading(true);
    setResetMessage("");

    try {
      const response = await fetch(
          `${API_URL}/api/users/reset-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: forgotEmail.trim(),
              newPassword,
            }),
          }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
            data?.detail ||
            data?.message ||
            "Password reset failed."
        );
      }

      setAuthForm({
        fullName: "",
        email: forgotEmail.trim(),
        password: "",
      });

      setOtp("");
      setNewPassword("");
      setConfirmPassword("");

      setPage("login");
      setResetMessage("");
      alert("Password reset successfully! Please log in.");
    } catch (error) {
      setResetMessage(error.message);
    } finally {
      setResetLoading(false);
    }
  };

  // Add application
  const handleAdd = async (e) => {
    e.preventDefault();

    if (
        !form.companyName.trim() ||
        !form.jobRole.trim() ||
        !form.location.trim() ||
        !form.appliedDate
    ) {
      alert("Please fill in all application fields.");
      return;
    }

    const cleanForm = {
      ...form,
      companyName: form.companyName.trim(),
      jobRole: form.jobRole.trim(),
      location: form.location.trim(),
    };

    try {
      const response = await fetch(
          `${API_URL}/api/applications`,
          {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(cleanForm),
          }
      );

      if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to save application."
            )
        );
      }

      const savedApplication = await response.json();

      setApplications((current) => [
        ...current,
        savedApplication,
      ]);

      resetForm();
      alert("Application saved successfully!");
    } catch (error) {
      alert(error.message);
    }
  };

  // Edit application
  const handleEdit = (app) => {
    setForm({
      companyName: app.companyName,
      jobRole: app.jobRole,
      location: app.location,
      status: app.status,
      appliedDate: app.appliedDate,
    });

    setEditingId(app.id);
    setShowForm(true);
  };

  // Update application
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (
        !form.companyName.trim() ||
        !form.jobRole.trim() ||
        !form.location.trim() ||
        !form.appliedDate
    ) {
      alert("Please fill in all application fields.");
      return;
    }

    const cleanForm = {
      ...form,
      companyName: form.companyName.trim(),
      jobRole: form.jobRole.trim(),
      location: form.location.trim(),
    };

    try {
      const response = await fetch(
          `${API_URL}/api/applications/${editingId}`,
          {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(cleanForm),
          }
      );

      if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to update application."
            )
        );
      }

      const updatedApplication = await response.json();

      setApplications((current) =>
          current.map((app) =>
              app.id === editingId ? updatedApplication : app
          )
      );

      resetForm();
      alert("Application updated successfully!");
    } catch (error) {
      alert(error.message);
    }
  };

  // Delete application
  const handleDelete = async (id) => {
    if (
        !window.confirm(
            "Are you sure you want to delete this application?"
        )
    ) {
      return;
    }

    try {
      const response = await fetch(
          `${API_URL}/api/applications/${id}`,
          {
            method: "DELETE",
            headers: getAuthHeaders(),
          }
      );

      if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to delete application."
            )
        );
      }

      setApplications((current) =>
          current.filter((app) => app.id !== id)
      );

      alert("Application deleted successfully!");
    } catch (error) {
      alert(error.message);
    }
  };

  // Reset application form
  const resetForm = () => {
    setForm({
      companyName: "",
      jobRole: "",
      location: "",
      status: "Applied",
      appliedDate: "",
    });

    setEditingId(null);
    setShowForm(false);
  };

  // Update profile
  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    const cleanName = profileName.trim();

    if (!cleanName) {
      alert("Please enter your full name.");
      return;
    }

    try {
      const response = await fetch(
          `${API_URL}/api/users/profile`,
          {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              fullName: cleanName,
            }),
          }
      );

      if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to update profile."
            )
        );
      }

      const updatedUser = await response.json();

      const updatedUserDetails = {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
      };

      setUser(updatedUserDetails);
      setProfileName(updatedUserDetails.fullName);

      localStorage.setItem(
          "careertrackAuth",
          JSON.stringify({
            user: updatedUserDetails,
            token,
          })
      );

      setEditProfile(false);
      alert("Profile updated successfully!");
    } catch (error) {
      alert(error.message);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("careertrackAuth");

    setUser(null);
    setToken(null);
    setApplications([]);
    setPage("login");
    setActiveMenu("Dashboard");
    setEditProfile(false);
    resetForm();
  };

  // Search and filter
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
        app.companyName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
        app.jobRole
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

    const matchesStatus =
        filterStatus === "All" ||
        app.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Login, registration and password screens
  if (!user) {
    return (
        <div className="auth-container">
          <form
              className="auth-card"
              onSubmit={
                page === "forgot"
                    ? handleForgotPassword
                    : page === "verifyOtp"
                        ? handleVerifyOtp
                        : page === "resetPassword"
                            ? handleResetPassword
                            : handleAuth
              }
          >
            <h1>CareerTrack</h1>

            {page === "login" && (
                <>
                  <p>Welcome back! Login to continue.</p>

                  <input
                      type="email"
                      placeholder="Email Address"
                      required
                      value={authForm.email}
                      onChange={(e) =>
                          setAuthForm({
                            ...authForm,
                            email: e.target.value,
                          })
                      }
                  />

                  <input
                      type="password"
                      placeholder="Password"
                      required
                      value={authForm.password}
                      onChange={(e) =>
                          setAuthForm({
                            ...authForm,
                            password: e.target.value,
                          })
                      }
                  />

                  <button type="submit">Login</button>

                  <p className="auth-switch">
                <span
                    onClick={() => {
                      setForgotEmail(authForm.email);
                      setResetMessage("");
                      setPage("forgot");
                    }}
                >
                  Forgot Password?
                </span>
                  </p>

                  <p className="auth-switch">
                    Don't have an account?
                    <span onClick={() => setPage("register")}>
                  {" "}Register
                </span>
                  </p>
                </>
            )}

            {page === "register" && (
                <>
                  <p>Create your CareerTrack account.</p>

                  <input
                      type="text"
                      placeholder="Full Name"
                      required
                      value={authForm.fullName}
                      onChange={(e) =>
                          setAuthForm({
                            ...authForm,
                            fullName: e.target.value,
                          })
                      }
                  />

                  <input
                      type="email"
                      placeholder="Email Address"
                      required
                      value={authForm.email}
                      onChange={(e) =>
                          setAuthForm({
                            ...authForm,
                            email: e.target.value,
                          })
                      }
                  />

                  <input
                      type="password"
                      placeholder="Password"
                      required
                      value={authForm.password}
                      onChange={(e) =>
                          setAuthForm({
                            ...authForm,
                            password: e.target.value,
                          })
                      }
                  />

                  <button type="submit">Register</button>

                  <p className="auth-switch">
                    Already have an account?
                    <span onClick={() => setPage("login")}>
                  {" "}Login
                </span>
                  </p>
                </>
            )}

            {page === "forgot" && (
                <>
                  <h2>Forgot Password?</h2>

                  <p>
                    Enter your registered email to receive an OTP.
                  </p>

                  <input
                      type="email"
                      placeholder="Registered Email"
                      required
                      value={forgotEmail}
                      onChange={(e) =>
                          setForgotEmail(e.target.value)
                      }
                  />

                  <button type="submit" disabled={resetLoading}>
                    {resetLoading ? "Sending..." : "Send OTP"}
                  </button>

                  <p className="auth-switch">
                <span onClick={() => setPage("login")}>
                  Back to Login
                </span>
                  </p>
                </>
            )}

            {page === "verifyOtp" && (
                <>
                  <h2>Verify OTP</h2>

                  <p>
                    Enter the six-digit code sent to your email.
                  </p>

                  <input
                      type="text"
                      placeholder="Enter OTP"
                      maxLength="6"
                      required
                      value={otp}
                      onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, ""))
                      }
                  />

                  <button type="submit" disabled={resetLoading}>
                    {resetLoading ? "Verifying..." : "Verify OTP"}
                  </button>

                  <p className="auth-switch">
                <span
                    onClick={() => {
                      setPage("forgot");
                      setResetMessage("");
                    }}
                >
                  Request another OTP
                </span>
                  </p>
                </>
            )}

            {page === "resetPassword" && (
                <>
                  <h2>Reset Password</h2>

                  <p>Create your new password.</p>

                  <input
                      type="password"
                      placeholder="New Password"
                      minLength="8"
                      required
                      value={newPassword}
                      onChange={(e) =>
                          setNewPassword(e.target.value)
                      }
                  />

                  <input
                      type="password"
                      placeholder="Confirm New Password"
                      minLength="8"
                      required
                      value={confirmPassword}
                      onChange={(e) =>
                          setConfirmPassword(e.target.value)
                      }
                  />

                  <button type="submit" disabled={resetLoading}>
                    {resetLoading ? "Resetting..." : "Reset Password"}
                  </button>
                </>
            )}

            {resetMessage && (
                <p role="status">{resetMessage}</p>
            )}
          </form>
        </div>
    );
  }

  // Application form
  const applicationForm = (
      <form
          className="application-form"
          onSubmit={editingId ? handleUpdate : handleAdd}
      >
        <h3>
          {editingId ? "Edit Application" : "Add New Application"}
        </h3>

        <input
            placeholder="Company Name"
            required
            value={form.companyName}
            onChange={(e) =>
                setForm({ ...form, companyName: e.target.value })
            }
        />

        <input
            placeholder="Job Role"
            required
            value={form.jobRole}
            onChange={(e) =>
                setForm({ ...form, jobRole: e.target.value })
            }
        />

        <input
            placeholder="Location"
            required
            value={form.location}
            onChange={(e) =>
                setForm({ ...form, location: e.target.value })
            }
        />

        <select
            value={form.status}
            onChange={(e) =>
                setForm({ ...form, status: e.target.value })
            }
        >
          <option>Applied</option>
          <option>Interview</option>
          <option>Offer</option>
          <option>Rejected</option>
        </select>

        <input
            type="date"
            required
            value={form.appliedDate}
            onChange={(e) =>
                setForm({ ...form, appliedDate: e.target.value })
            }
        />

        <button type="submit">
          {editingId ? "Update Application" : "Save Application"}
        </button>

        <button type="button" onClick={resetForm}>
          Cancel
        </button>
      </form>
  );

  // Applications table
  const applicationTable = (
      <>
        <div className="search-filter">
          <input
              placeholder="Search company or job role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Applied">Applied</option>
            <option value="Interview">Interview</option>
            <option value="Offer">Offer</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <table>
          <thead>
          <tr>
            <th>Company</th>
            <th>Job Role</th>
            <th>Location</th>
            <th>Status</th>
            <th>Applied Date</th>
            <th>Actions</th>
          </tr>
          </thead>

          <tbody>
          {filteredApplications.map((app) => (
              <tr key={app.id}>
                <td>{app.companyName}</td>
                <td>{app.jobRole}</td>
                <td>{app.location}</td>
                <td>
                  <span className="status">{app.status}</span>
                </td>
                <td>{app.appliedDate}</td>
                <td>
                  <button onClick={() => handleEdit(app)}>
                    Edit
                  </button>{" "}

                  <button
                      className="delete-button"
                      onClick={() => handleDelete(app.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
          ))}

          {filteredApplications.length === 0 && (
              <tr>
                <td colSpan="6">No applications found.</td>
              </tr>
          )}
          </tbody>
        </table>
      </>
  );

  // Main dashboard
  return (
      <div className="app">
        <aside className="sidebar">
          <h2>CareerTrack</h2>

          <p className="menu-title">MENU</p>

          <div
              className={`menu-item ${
                  activeMenu === "Dashboard" ? "active" : ""
              }`}
              onClick={() => {
                setActiveMenu("Dashboard");
                resetForm();
              }}
          >
            Dashboard
          </div>

          <div
              className={`menu-item ${
                  activeMenu === "Applications" ? "active" : ""
              }`}
              onClick={() => {
                setActiveMenu("Applications");
                resetForm();
              }}
          >
            Applications
          </div>

          <div
              className={`menu-item ${
                  activeMenu === "Profile" ? "active" : ""
              }`}
              onClick={() => {
                setActiveMenu("Profile");
                setProfileName(user.fullName);
                setEditProfile(false);
                resetForm();
              }}
          >
            Profile
          </div>

          <div className="menu-item" onClick={handleLogout}>
            Logout
          </div>
        </aside>

        <main className="main-content">
          {activeMenu === "Dashboard" && (
              <>
                <header className="topbar">
                  <div>
                    <h2>Dashboard</h2>
                    <p>Welcome, {user.fullName}!</p>
                  </div>

                  <button
                      onClick={() => {
                        resetForm();
                        setShowForm(true);
                      }}
                  >
                    + Add Application
                  </button>
                </header>

                <section className="stats">
                  <div className="stat-card">
                    <p>Total Applications</p>
                    <h2>{applications.length}</h2>
                  </div>

                  <div className="stat-card">
                    <p>Applied</p>
                    <h2>
                      {
                        applications.filter(
                            (a) => a.status === "Applied"
                        ).length
                      }
                    </h2>
                  </div>

                  <div className="stat-card">
                    <p>Interviews</p>
                    <h2>
                      {
                        applications.filter(
                            (a) => a.status === "Interview"
                        ).length
                      }
                    </h2>
                  </div>

                  <div className="stat-card">
                    <p>Offers</p>
                    <h2>
                      {
                        applications.filter(
                            (a) => a.status === "Offer"
                        ).length
                      }
                    </h2>
                  </div>
                </section>

                {showForm && applicationForm}

                <section className="applications">
                  <h3>Recent Applications</h3>
                  {applicationTable}
                </section>
              </>
          )}

          {activeMenu === "Applications" && (
              <>
                <header className="topbar">
                  <div>
                    <h2>Applications</h2>
                    <p>Manage all your job applications</p>
                  </div>

                  <button
                      onClick={() => {
                        resetForm();
                        setShowForm(true);
                      }}
                  >
                    + Add Application
                  </button>
                </header>

                {showForm && applicationForm}

                <section className="applications">
                  <h3>All Applications ({applications.length})</h3>
                  {applicationTable}
                </section>
              </>
          )}

          {activeMenu === "Profile" && (
              <>
                <header className="topbar">
                  <div>
                    <h2>My Profile</h2>
                    <p>Manage your account information</p>
                  </div>
                </header>

                <section className="applications profile-section">
                  <h3>Personal Information</h3>

                  {!editProfile ? (
                      <div className="profile-details">
                        <p>
                          <strong>Full Name:</strong> {user.fullName}
                        </p>

                        <p>
                          <strong>Email Address:</strong> {user.email}
                        </p>

                        <p>
                          <strong>User ID:</strong> {user.id}
                        </p>

                        <p>
                          <strong>Total Applications:</strong>{" "}
                          {applications.length}
                        </p>

                        <button
                            onClick={() => {
                              setProfileName(user.fullName);
                              setEditProfile(true);
                            }}
                        >
                          Edit Profile
                        </button>
                      </div>
                  ) : (
                      <form
                          className="application-form"
                          onSubmit={handleProfileUpdate}
                      >
                        <label>Full Name</label>

                        <input
                            type="text"
                            value={profileName}
                            placeholder="Enter your full name"
                            required
                            onChange={(e) =>
                                setProfileName(e.target.value)
                            }
                        />

                        <label>Email Address</label>

                        <input
                            type="email"
                            value={user.email}
                            disabled
                        />

                        <button type="submit">Save Profile</button>

                        <button
                            type="button"
                            onClick={() => {
                              setProfileName(user.fullName);
                              setEditProfile(false);
                            }}
                        >
                          Cancel
                        </button>
                      </form>
                  )}
                </section>
              </>
          )}
        </main>
      </div>
  );
}

export default App;
