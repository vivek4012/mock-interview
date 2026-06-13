import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const InterviewResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { interviewId } = location.state || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [interviewData, setInterviewData] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    if (!interviewId) {
      console.error("No interview ID found");
      navigate("/dashboard");
      return;
    }

    const fetchAnalysis = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/api/interview/${interviewId}/analysis`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.status === "success") {
          setInterviewData(response.data.data.interview);
          setAnalysis(response.data.data.analysis);
        }
      } catch (err) {
        console.error("Error fetching analysis:", err.response?.data || err.message);
        setError(
          err.response?.data?.message ||
            "Failed to load interview results. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [interviewId, navigate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading Results...</h2>
          <p className="text-muted-foreground">Please wait while we fetch your interview analysis.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>{error}</p>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Analysis Available</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">This interview has not been analyzed yet.</p>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Interview Analysis Report</CardTitle>
            <CardDescription className="space-y-1 mt-4">
              <p><strong>Role:</strong> {interviewData.role}</p>
              <p><strong>Date:</strong> {formatDate(interviewData.completedAt)}</p>
              <p><strong>Duration:</strong> {interviewData.duration} minutes</p>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Overall Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold">{analysis.overallScore}%</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Technical Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold">{analysis.technicalScore}%</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Communication Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold">{analysis.communicationScore}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Behavioral Traits */}
        <Card>
          <CardHeader>
            <CardTitle>Behavioral Traits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(analysis.behavioralTraits || {}).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="capitalize font-medium">{key}</span>
                  <span className="text-muted-foreground">{value}%</span>
                </div>
                <Progress value={value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Detailed Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {analysis.detailedFeedback}
            </p>
          </CardContent>
        </Card>

        {/* Strengths */}
        <Card>
          <CardHeader>
            <CardTitle>Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.strengths?.map((strength, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Badge variant="success" className="mt-0.5">✓</Badge>
                  <span className="text-muted-foreground flex-1">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Areas to Improve */}
        <Card>
          <CardHeader>
            <CardTitle>Areas to Improve</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.areasToImprove?.map((area, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Badge variant="warning" className="mt-0.5">!</Badge>
                  <span className="text-muted-foreground flex-1">{area}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.keyInsights?.map((insight, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Badge variant="default" className="mt-0.5">i</Badge>
                  <span className="text-muted-foreground flex-1">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recommended Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.recommendedResources?.map((resource, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">📚</Badge>
                  <span className="text-muted-foreground flex-1">{resource}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="flex justify-center pt-4">
          <Button onClick={() => navigate("/dashboard")} size="lg">
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewResults;
