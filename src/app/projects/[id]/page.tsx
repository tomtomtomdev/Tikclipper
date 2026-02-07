"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Upload, Play, Scissors, Link, Download, Loader2, Wand2, Copy, Check } from "lucide-react";

interface SceneAnalysis {
  timestamp: number;
  description: string;
  products: string[];
  actions: string[];
  emotionalTone: string;
  clipWorthy: boolean;
  clipWorthyReason?: string;
}

interface Clip {
  id: string;
  startTime: number;
  endTime: number;
  description: string;
  confidenceScore: number;
  outputPath: string | null;
  format: string;
  caption: string | null;
  hashtags: string[] | null;
  ctaText: string | null;
  productLinkId: string | null;
  status: string;
}

interface ProductLink {
  id: string;
  url: string;
  title: string;
  image: string | null;
  category: string | null;
  matchedScenes: unknown;
}

interface Project {
  id: string;
  name: string;
  status: string;
  sourceVideoPath: string | null;
  sourceVideoName: string | null;
  duration: number | null;
  sceneTimeline: SceneAnalysis[] | null;
  clips: Clip[];
  productLinks: ProductLink[];
}

export default function ProjectPage() {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newLink, setNewLink] = useState({ url: "", title: "", category: "" });
  const [copied, setCopied] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${id}`);
    if (res.ok) setProject(await res.json());
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  // Poll while analyzing/generating
  useEffect(() => {
    if (!project) return;
    if (project.status === "analyzing" || project.status === "generating") {
      const interval = setInterval(fetchProject, 3000);
      return () => clearInterval(interval);
    }
  }, [project?.status, fetchProject]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("video", file);
    formData.append("projectId", id);
    await fetch("/api/upload", { method: "POST", body: formData });
    setUploading(false);
    fetchProject();
  };

  const startAnalysis = async () => {
    setAnalyzing(true);
    await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: id }),
    });
    fetchProject();
  };

  const generateAllClips = async () => {
    setGenerating(true);
    await fetch("/api/clips", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: id }),
    });
    setGenerating(false);
    fetchProject();
  };

  const generateCaption = async (clipId: string, tone: string) => {
    await fetch(`/api/clips/${clipId}/captions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tone }),
    });
    fetchProject();
  };

  const addProductLink = async () => {
    if (!newLink.url) return;
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: id, ...newLink }),
    });
    setNewLink({ url: "", title: "", category: "" });
    fetchProject();
  };

  const exportProject = async () => {
    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: id }),
    });
    const data = await res.json();
    if (data.zipPath) alert(`Export ready: ${data.zipPath} (${data.clipCount} clips)`);
  };

  const copyToClipboard = (text: string, clipId: string) => {
    navigator.clipboard.writeText(text);
    setCopied(clipId);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!project) return <div className="container mx-auto px-4 py-8">Loading...</div>;

  const timeline = project.sceneTimeline || [];
  const clips = project.clips || [];
  const links = project.productLinks || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">
            {project.sourceVideoName || "No video uploaded"}
            {project.duration ? ` · ${Math.round(project.duration)}s` : ""}
          </p>
        </div>
        <Badge variant="outline" className="text-sm">{project.status}</Badge>
      </div>

      <Tabs defaultValue="upload">
        <TabsList className="mb-6">
          <TabsTrigger value="upload"><Upload className="h-4 w-4 mr-1" /> Upload</TabsTrigger>
          <TabsTrigger value="timeline"><Play className="h-4 w-4 mr-1" /> Timeline</TabsTrigger>
          <TabsTrigger value="clips"><Scissors className="h-4 w-4 mr-1" /> Clips ({clips.length})</TabsTrigger>
          <TabsTrigger value="products"><Link className="h-4 w-4 mr-1" /> Products ({links.length})</TabsTrigger>
          <TabsTrigger value="export"><Download className="h-4 w-4 mr-1" /> Export</TabsTrigger>
        </TabsList>

        {/* UPLOAD TAB */}
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Video</CardTitle>
              <CardDescription>Upload your raw video footage (MP4, MOV, up to 2GB)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.sourceVideoPath ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-medium">{project.sourceVideoName}</p>
                    <p className="text-sm text-muted-foreground">Video uploaded successfully</p>
                  </div>
                  {project.status === "uploading" || project.status === "created" ? (
                    <Button onClick={startAnalysis} disabled={analyzing}>
                      {analyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                      Analyze Video with AI
                    </Button>
                  ) : project.status === "analyzing" ? (
                    <div className="space-y-2">
                      <p className="text-sm">Analyzing video...</p>
                      <Progress value={50} />
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <Label htmlFor="video-upload" className="cursor-pointer">
                    <span className="text-primary font-medium">Click to upload</span> or drag and drop
                    <Input
                      id="video-upload"
                      type="file"
                      accept="video/mp4,video/quicktime"
                      className="hidden"
                      onChange={handleUpload}
                      disabled={uploading}
                    />
                  </Label>
                  {uploading && <p className="mt-4 text-sm text-muted-foreground">Uploading...</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TIMELINE TAB */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Scene Timeline</CardTitle>
              <CardDescription>{timeline.length} scenes detected</CardDescription>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  No scenes yet. Upload a video and run analysis first.
                </p>
              ) : (
                <div className="space-y-3">
                  {timeline.map((scene, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${scene.clipWorthy ? "border-primary bg-primary/5" : ""}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{scene.timestamp}s</Badge>
                        <span className="text-sm font-medium">{scene.emotionalTone}</span>
                        {scene.clipWorthy && <Badge className="text-xs">Clip-worthy</Badge>}
                      </div>
                      <p className="text-sm">{scene.description}</p>
                      {scene.products.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {scene.products.map((p, j) => (
                            <Badge key={j} variant="secondary" className="text-xs">{p}</Badge>
                          ))}
                        </div>
                      )}
                      {scene.clipWorthyReason && (
                        <p className="text-xs text-muted-foreground mt-1">{scene.clipWorthyReason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CLIPS TAB */}
        <TabsContent value="clips">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Detected Clips</h2>
              {clips.some(c => c.status === "pending") && (
                <Button onClick={generateAllClips} disabled={generating}>
                  {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Scissors className="h-4 w-4 mr-2" />}
                  Generate All Clips
                </Button>
              )}
            </div>
            {clips.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No clips detected yet. Run video analysis first.
                </CardContent>
              </Card>
            ) : (
              clips.map((clip) => (
                <Card key={clip.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {clip.startTime}s — {clip.endTime}s
                        <span className="text-muted-foreground font-normal ml-2">
                          ({Math.round(clip.endTime - clip.startTime)}s)
                        </span>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {clip.confidenceScore && (
                          <Badge variant="outline">{Math.round(clip.confidenceScore * 100)}%</Badge>
                        )}
                        <Badge variant={clip.status === "done" ? "default" : "secondary"}>
                          {clip.status}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{clip.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {clip.caption && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Caption</Label>
                        <div className="flex items-start gap-2">
                          <p className="text-sm flex-1">{clip.caption}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(clip.caption!, clip.id + "-caption")}
                          >
                            {copied === clip.id + "-caption" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    )}
                    {clip.hashtags && clip.hashtags.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Hashtags</Label>
                        <div className="flex items-start gap-2">
                          <p className="text-sm flex-1 flex flex-wrap gap-1">
                            {clip.hashtags.map((h, i) => (
                              <span key={i} className="text-primary">{h}</span>
                            ))}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(clip.hashtags!.join(" "), clip.id + "-hash")}
                          >
                            {copied === clip.id + "-hash" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    )}
                    {clip.ctaText && (
                      <p className="text-sm text-muted-foreground">CTA: {clip.ctaText}</p>
                    )}
                    <Separator />
                    <div className="flex gap-2">
                      <Select onValueChange={(tone) => generateCaption(clip.id, tone)}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Generate caption..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="casual">Casual tone</SelectItem>
                          <SelectItem value="professional">Professional tone</SelectItem>
                          <SelectItem value="hype">Hype tone</SelectItem>
                          <SelectItem value="educational">Educational tone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* PRODUCTS TAB */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Product Links</CardTitle>
              <CardDescription>Add Shopee affiliate product links to match with clips</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Shopee URL</Label>
                  <Input
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    placeholder="https://shopee.co.th/..."
                  />
                </div>
                <div>
                  <Label>Product Title</Label>
                  <Input
                    value={newLink.title}
                    onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                    placeholder="Product name"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newLink.category}
                      onChange={(e) => setNewLink({ ...newLink, category: e.target.value })}
                      placeholder="e.g. skincare"
                    />
                    <Button onClick={addProductLink}>Add</Button>
                  </div>
                </div>
              </div>
              <Separator />
              {links.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No product links added yet.</p>
              ) : (
                <div className="space-y-2">
                  {links.map((link) => (
                    <div key={link.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{link.title || "Untitled"}</p>
                        <p className="text-sm text-muted-foreground truncate">{link.url}</p>
                      </div>
                      {link.category && <Badge variant="outline">{link.category}</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* EXPORT TAB */}
        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export</CardTitle>
              <CardDescription>Download all completed clips as a ZIP file with metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 border rounded-lg">
                  <p className="text-2xl font-bold">{clips.length}</p>
                  <p className="text-sm text-muted-foreground">Total Clips</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-2xl font-bold">{clips.filter(c => c.status === "done").length}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-2xl font-bold">{clips.filter(c => c.status === "processing").length}</p>
                  <p className="text-sm text-muted-foreground">Processing</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-2xl font-bold">{links.length}</p>
                  <p className="text-sm text-muted-foreground">Products</p>
                </div>
              </div>
              <Button
                size="lg"
                className="w-full"
                onClick={exportProject}
                disabled={clips.filter(c => c.status === "done").length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export All Clips as ZIP
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
