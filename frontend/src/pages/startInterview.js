import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const StartInterview = () => {
  const [formData, setFormData] = useState({
    designation: "",
    experience: "",
    areaToFocus: "",
    jobDescription: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const res = await axios.post(
        `${API_BASE_URL}/api/interview`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Interview created:", res.data);

      navigate("/interview-playground", {
        state: { interviewId: res.data.data.interview.id },
      });
    } catch (err) {
      console.error(
        "Error creating interview:",
        err.response?.data || err.message
      );
      setError(
        err.response?.data?.message ||
          "Failed to create interview. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Start New Interview</CardTitle>
            <CardDescription>
              Configure your mock interview session by providing the details below
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="designation">Designation *</Label>
                <Input
                  type="text"
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Experience *</Label>
                <Input
                  type="text"
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 5 years"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="areaToFocus">Area to Focus *</Label>
                <Input
                  type="text"
                  id="areaToFocus"
                  name="areaToFocus"
                  value={formData.areaToFocus}
                  onChange={handleChange}
                  required
                  placeholder="e.g., React, Node.js, System Design"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobDescription">Job Description *</Label>
                <Textarea
                  id="jobDescription"
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleChange}
                  required
                  placeholder="Enter the job description or key requirements..."
                  rows={6}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Creating..." : "Start Interview"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StartInterview;
