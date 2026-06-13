import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const InterviewPlayground = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { interviewId } = location.state || {};

  // WebSocket and Audio refs
  const socket = useRef(null);
  const audioContext = useRef(null);
  const mediaStream = useRef(null);
  const scriptProcessor = useRef(null);

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assemblyaiToken, setAssemblyaiToken] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [completedTranscript, setCompletedTranscript] = useState("");
  const [isLastQuestion, setIsLastQuestion] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [percentageComplete, setPercentageComplete] = useState(0);

  // Redirect to dashboard if no interviewId
  useEffect(() => {
    if (!interviewId) {
      console.error("No interview ID found");
      navigate("/dashboard");
    }
  }, [interviewId, navigate]);

  // Start interview on component mount
  useEffect(() => {
    if (interviewId) {
      startInterviewSession();
    }
  }, [interviewId]);

  const startInterviewSession = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/interview/${interviewId}/start`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.status === "success") {
        const { assemblyaiToken, firstQuestion } = response.data.data;

        setAssemblyaiToken(assemblyaiToken.token);
        setCurrentQuestion(firstQuestion.text);
        setTimeRemaining(firstQuestion.timeRemaining);
        setPercentageComplete(firstQuestion.percentageComplete);
      }
    } catch (err) {
      console.error(
        "Error starting interview:",
        err.response?.data || err.message
      );
      setError(
        err.response?.data?.message ||
          "Failed to start interview. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    if (!assemblyaiToken) {
      setError("AssemblyAI token not available");
      return;
    }

    try {
      const wsUrl = `wss://streaming.assemblyai.com/v3/ws?token=${assemblyaiToken}`;
      socket.current = new WebSocket(wsUrl);

      socket.current.onopen = async () => {
        console.log("WebSocket connection established");
        setIsRecording(true);
        setCurrentTranscript("");
        setCompletedTranscript("");
        setError("");

        mediaStream.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        audioContext.current = new AudioContext({ sampleRate: 16000 });

        const source = audioContext.current.createMediaStreamSource(
          mediaStream.current
        );
        scriptProcessor.current = audioContext.current.createScriptProcessor(
          4096,
          1,
          1
        );

        source.connect(scriptProcessor.current);
        scriptProcessor.current.connect(audioContext.current.destination);

        scriptProcessor.current.onaudioprocess = (event) => {
          if (!socket.current || socket.current.readyState !== WebSocket.OPEN)
            return;

          const input = event.inputBuffer.getChannelData(0);
          const buffer = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            buffer[i] = Math.max(-1, Math.min(1, input[i])) * 0x7fff;
          }
          socket.current.send(buffer.buffer);
        };
      };

      socket.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log(message, "Transcription message");

        if (message.transcript && message.transcript.trim()) {
          if (message.end_of_turn) {
            console.log("End of turn detected");
            setCompletedTranscript((prev) =>
              prev ? `${prev} ${message.transcript}` : message.transcript
            );
            setCurrentTranscript("");
          } else {
            setCurrentTranscript(message.transcript);
          }
        }
      };

      socket.current.onerror = (err) => {
        console.error("WebSocket error:", err);
        setError("Error with transcription service");
        stopRecording();
      };

      socket.current.onclose = () => {
        console.log("WebSocket closed");
        socket.current = null;
      };
    } catch (err) {
      console.error("Error starting recording:", err);
      setError(
        "Failed to start recording. Please check microphone permissions."
      );
    }
  };

  const stopRecording = () => {
    setIsRecording(false);

    if (scriptProcessor.current) {
      scriptProcessor.current.disconnect();
      scriptProcessor.current = null;
    }

    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
    }

    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach((track) => track.stop());
      mediaStream.current = null;
    }

    if (socket.current) {
      socket.current.send(JSON.stringify({ terminate_session: true }));
      socket.current.close();
      socket.current = null;
    }
  };

  const submitAnswer = async () => {
    const fullTranscript = completedTranscript
      ? currentTranscript
        ? `${completedTranscript} ${currentTranscript}`
        : completedTranscript
      : currentTranscript;

    if (!fullTranscript.trim()) {
      setError("Please record an answer before submitting");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (isRecording) {
        stopRecording();
      }

      const transcriptResponse = await axios.post(
        `${API_BASE_URL}/api/interview/${interviewId}/transcript`,
        {
          message: fullTranscript,
          sender: "Candidate",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (transcriptResponse.data.status === "success") {
        setCurrentTranscript("");
        setCompletedTranscript("");

        const questionResponse = await axios.post(
          `${API_BASE_URL}/api/interview/${interviewId}/question`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (questionResponse.data.status === "success") {
          const {
            question,
            timeRemaining,
            percentageComplete,
            isLastQuestion,
          } = questionResponse.data.data;

          setCurrentQuestion(question);
          setTimeRemaining(timeRemaining);
          setPercentageComplete(percentageComplete);
          setIsLastQuestion(isLastQuestion);
        }
      }
    } catch (err) {
      console.error(
        "Error submitting answer:",
        err.response?.data || err.message
      );
      setError(
        err.response?.data?.message ||
          "Failed to submit answer. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitAndAnalyze = async () => {
    setIsAnalyzing(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (isRecording) {
        stopRecording();
      }

      const fullTranscript = completedTranscript
        ? currentTranscript
          ? `${completedTranscript} ${currentTranscript}`
          : completedTranscript
        : currentTranscript;

      if (fullTranscript.trim()) {
        await axios.post(
          `${API_BASE_URL}/api/interview/${interviewId}/transcript`,
          {
            message: fullTranscript,
            sender: "Candidate",
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      const endResponse = await axios.post(
        `${API_BASE_URL}/api/interview/${interviewId}/end`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (endResponse.data.status === "success") {
        const analyzeResponse = await axios.post(
          `${API_BASE_URL}/api/interview/${interviewId}/analyze`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (analyzeResponse.data.status === "success") {
          navigate("/interview-results", {
            state: { interviewId: interviewId },
          });
        }
      }
    } catch (err) {
      console.error(
        "Error analyzing interview:",
        err.response?.data || err.message
      );
      setError(
        err.response?.data?.message ||
          "Failed to analyze interview. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Starting Interview...</h2>
          <p className="text-muted-foreground">Please wait while we prepare your interview session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-3xl">Interview in Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Section */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress: {percentageComplete}%</span>
                <span>Time Remaining: {timeRemaining} minutes</span>
              </div>
              <Progress value={percentageComplete} className="h-3" />
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Question Display */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg text-blue-900">Question:</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed">{currentQuestion}</p>
              </CardContent>
            </Card>

            {/* Recording Controls */}
            {!isRecording && (
              <Button
                onClick={startRecording}
                className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
              >
                Start Recording
              </Button>
            )}

            {/* Recording Status */}
            {isRecording && (
              <Alert className="border-red-500 bg-red-50">
                <AlertDescription className="text-center text-red-700 font-semibold text-lg">
                  🔴 Recording in progress...
                </AlertDescription>
              </Alert>
            )}

            {/* Transcript Display */}
            {(completedTranscript || currentTranscript) && (
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-sm uppercase text-muted-foreground">
                    Your Answer:
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base leading-relaxed">
                    {completedTranscript && <span>{completedTranscript}</span>}
                    {completedTranscript && currentTranscript && <span> </span>}
                    {currentTranscript && (
                      <span className="opacity-70 italic">{currentTranscript}</span>
                    )}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-4">
              {!isLastQuestion ? (
                <Button
                  onClick={submitAnswer}
                  disabled={
                    (!currentTranscript.trim() && !completedTranscript.trim()) ||
                    isSubmitting
                  }
                  className="flex-1 h-12"
                  size="lg"
                >
                  {isSubmitting
                    ? "Submitting..."
                    : isRecording
                    ? "Stop & Submit Answer"
                    : "Submit Answer"}
                </Button>
              ) : (
                <Button
                  onClick={submitAndAnalyze}
                  disabled={isAnalyzing}
                  className="flex-1 h-12 bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {isAnalyzing
                    ? "Analyzing Interview..."
                    : isRecording
                    ? "Stop & Analyze Interview"
                    : "Submit and Analyze Interview"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InterviewPlayground;
