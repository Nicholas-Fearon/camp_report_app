// /app/dashboard/page.js
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentCoach, signOut } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Plus, Users, FileText, LogOut, Edit, Trash2 } from "lucide-react";

export default function Dashboard() {
  const [coach, setCoach] = useState(null);
  const [players, setPlayers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const router = useRouter();

  // Player form state
  const [playerForm, setPlayerForm] = useState({
    name: "",
    position: "",
    age: "",
    jersey_number: "",
  });

  // Report form state
  const [reportForm, setReportForm] = useState({
    player_id: "",
    report_date: new Date().toISOString().split("T")[0],
    technical_skills: 5,
    physical_condition: 5,
    teamwork: 5,
    attitude: 5,
    strengths: "",
    areas_for_improvement: "",
    additional_notes: "",
  });

  useEffect(() => {
    checkAuth();
  });

  const checkAuth = async () => {
    try {
      const currentCoach = await getCurrentCoach();
      if (!currentCoach) {
        router.push("/");
        return;
      }
      setCoach(currentCoach);
      await loadData(currentCoach.id);
    } catch (error) {
      console.error("Auth error:", error);
      router.push("/");
    }
  };

  const loadData = async (coachId) => {
    try {
      // Load players
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("coach_id", coachId)
        .order("name");

      if (playersError) throw playersError;
      setPlayers(playersData || []);

      // Load recent reports
      const { data: reportsData, error: reportsError } = await supabase
        .from("reports")
        .select(
          `
          *,
          players:player_id (name)
        `
        )
        .eq("coach_id", coachId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (reportsError) throw reportsError;
      setReports(reportsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from("players")
        .insert([
          {
            ...playerForm,
            coach_id: coach.id,
            age: playerForm.age ? parseInt(playerForm.age) : null,
            jersey_number: playerForm.jersey_number
              ? parseInt(playerForm.jersey_number)
              : null,
          },
        ])
        .select();

      if (error) throw error;

      setPlayers([...players, data[0]]);
      setPlayerForm({ name: "", position: "", age: "", jersey_number: "" });
      setShowAddPlayer(false);
    } catch (error) {
      console.error("Error adding player:", error);
      alert("Error adding player: " + error.message);
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from("reports").insert([
        {
          ...reportForm,
          coach_id: coach.id,
          technical_skills: parseInt(reportForm.technical_skills),
          physical_condition: parseInt(reportForm.physical_condition),
          teamwork: parseInt(reportForm.teamwork),
          attitude: parseInt(reportForm.attitude),
        },
      ]).select(`
          *,
          players:player_id (name)
        `);

      if (error) throw error;

      setReports([data[0], ...reports]);
      setReportForm({
        player_id: "",
        report_date: new Date().toISOString().split("T")[0],
        technical_skills: 5,
        physical_condition: 5,
        teamwork: 5,
        attitude: 5,
        strengths: "",
        areas_for_improvement: "",
        additional_notes: "",
      });
      setShowCreateReport(false);
    } catch (error) {
      console.error("Error creating report:", error);
      alert("Error creating report: " + error.message);
    }
  };

  const handleDeletePlayer = async (playerId) => {
    if (
      !confirm(
        "Are you sure you want to delete this player? This will also delete all their reports."
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("players")
        .delete()
        .eq("id", playerId);

      if (error) throw error;

      setPlayers(players.filter((p) => p.id !== playerId));
      setReports(reports.filter((r) => r.player_id !== playerId));
    } catch (error) {
      console.error("Error deleting player:", error);
      alert("Error deleting player: " + error.message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Camp Report Dashboard
              </h1>
              <p className="text-gray-600">Welcome back, {coach?.full_name}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Players
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {players.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Reports
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {reports.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Plus className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Team
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {coach?.team_name || "Not Set"}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Players Section */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Players
                </h3>
                <button
                  onClick={() => setShowAddPlayer(!showAddPlayer)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Player
                </button>
              </div>

              {showAddPlayer && (
                <form
                  onSubmit={handleAddPlayer}
                  className="mb-6 p-4 bg-gray-50 rounded-md"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Player Name"
                      value={playerForm.name}
                      onChange={(e) =>
                        setPlayerForm({ ...playerForm, name: e.target.value })
                      }
                      className="border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Position"
                      value={playerForm.position}
                      onChange={(e) =>
                        setPlayerForm({
                          ...playerForm,
                          position: e.target.value,
                        })
                      }
                      className="border border-gray-300 rounded-md px-3 py-2"
                    />
                    <input
                      type="number"
                      placeholder="Age"
                      value={playerForm.age}
                      onChange={(e) =>
                        setPlayerForm({ ...playerForm, age: e.target.value })
                      }
                      className="border border-gray-300 rounded-md px-3 py-2"
                    />
                    <input
                      type="number"
                      placeholder="Jersey Number"
                      value={playerForm.jersey_number}
                      onChange={(e) =>
                        setPlayerForm({
                          ...playerForm,
                          jersey_number: e.target.value,
                        })
                      }
                      className="border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add Player
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddPlayer(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <p className="text-sm text-gray-500">
                        {player.position}{" "}
                        {player.jersey_number && `#${player.jersey_number}`}{" "}
                        {player.age && `(Age: ${player.age})`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedPlayer(player);
                          setReportForm({
                            ...reportForm,
                            player_id: player.id,
                          });
                          setShowCreateReport(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePlayer(player.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {players.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No players added yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Reports Section */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Reports
                </h3>
                {players.length > 0 && (
                  <button
                    onClick={() => setShowCreateReport(!showCreateReport)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    New Report
                  </button>
                )}
              </div>

              {showCreateReport && (
                <form
                  onSubmit={handleCreateReport}
                  className="mb-6 p-4 bg-gray-50 rounded-md"
                >
                  <div className="space-y-4">
                    <select
                      value={reportForm.player_id}
                      onChange={(e) =>
                        setReportForm({
                          ...reportForm,
                          player_id: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="">Select Player</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="date"
                      value={reportForm.report_date}
                      onChange={(e) =>
                        setReportForm({
                          ...reportForm,
                          report_date: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        "technical_skills",
                        "physical_condition",
                        "teamwork",
                        "attitude",
                      ].map((field) => (
                        <div key={field}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field
                              .replace("_", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
                            (1-10)
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={reportForm[field]}
                            onChange={(e) =>
                              setReportForm({
                                ...reportForm,
                                [field]: e.target.value,
                              })
                            }
                            className="w-full"
                          />
                          <span className="text-sm text-gray-500">
                            {reportForm[field]}/10
                          </span>
                        </div>
                      ))}
                    </div>

                    <textarea
                      placeholder="Strengths"
                      value={reportForm.strengths}
                      onChange={(e) =>
                        setReportForm({
                          ...reportForm,
                          strengths: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      rows="3"
                    />

                    <textarea
                      placeholder="Areas for Improvement"
                      value={reportForm.areas_for_improvement}
                      onChange={(e) =>
                        setReportForm({
                          ...reportForm,
                          areas_for_improvement: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      rows="3"
                    />

                    <textarea
                      placeholder="Additional Notes"
                      value={reportForm.additional_notes}
                      onChange={(e) =>
                        setReportForm({
                          ...reportForm,
                          additional_notes: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      rows="3"
                    />
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Create Report
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateReport(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {reports.map((report) => (
                  <div key={report.id} className="p-3 bg-gray-50 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{report.players?.name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(report.report_date).toLocaleDateString()}
                        </p>
                        <div className="mt-2 text-sm">
                          <span className="text-gray-600">
                            Avg:{" "}
                            {(
                              (report.technical_skills +
                                report.physical_condition +
                                report.teamwork +
                                report.attitude) /
                              4
                            ).toFixed(1)}
                            /10
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {reports.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No reports created yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
