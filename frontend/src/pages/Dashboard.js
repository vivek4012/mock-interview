import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      console.log("No token, redirecting to login");
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const userRes = await axios.get(`${API_BASE_URL}/api/auth/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userRes.data);

        const interviewRes = await axios.get(
          `${API_BASE_URL}/api/interview/list`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setInterviews(interviewRes.data.data.interviews);
      } catch (err) {
        console.error(
          "Error fetching data:",
          err.response?.data || err.message
        );
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: "success",
      "in-progress": "warning",
      pending: "secondary",
    };

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    );
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={user?.profilePicture}
                    alt={`${user?.firstName} ${user?.lastName}`}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">
                    Welcome, {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => navigate("/start-interview")} size="lg">
                  + New Interview
                </Button>
                <Button onClick={handleLogout} variant="destructive" size="lg">
                  Logout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interview List Card */}
        <Card>
          <CardHeader>
            <CardTitle>My Interviews ({interviews.length})</CardTitle>
            <CardDescription>
              Track and review your mock interview sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {interviews.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg mb-2">
                  No interviews yet.
                </p>
                <p className="text-sm text-muted-foreground">
                  Click "New Interview" to start your first mock interview.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interviews.map((interview) => (
                      <TableRow key={interview.id}>
                        <TableCell className="font-medium">
                          {interview.role}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(interview.date)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(interview.status)}
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {interview.score !== null ? `${interview.score}%` : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            onClick={() =>
                              navigate("/interview-results", {
                                state: { interviewId: interview.id },
                              })
                            }
                            disabled={interview.status !== "completed"}
                            variant={interview.status !== "completed" ? "secondary" : "default"}
                            size="sm"
                          >
                            View Results
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
