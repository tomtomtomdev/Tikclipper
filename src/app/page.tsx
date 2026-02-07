import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Scissors, Link, Hash } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">TikClipper</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          AI-powered video clipper for Shopee affiliate marketers. Upload your product review videos,
          get TikTok-ready clips with captions and affiliate links — automatically.
        </p>
        <a href="/dashboard">
          <Button size="lg">Get Started</Button>
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <Upload className="h-8 w-8 mb-2 text-primary" />
            <CardTitle className="text-lg">Upload</CardTitle>
            <CardDescription>Upload your raw product review or unboxing video</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Scissors className="h-8 w-8 mb-2 text-primary" />
            <CardTitle className="text-lg">AI Clips</CardTitle>
            <CardDescription>AI detects the best moments and generates short-form clips</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Link className="h-8 w-8 mb-2 text-primary" />
            <CardTitle className="text-lg">Product Links</CardTitle>
            <CardDescription>Auto-match Shopee affiliate links to the right clips</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Hash className="h-8 w-8 mb-2 text-primary" />
            <CardTitle className="text-lg">Captions</CardTitle>
            <CardDescription>Generate captions, hashtags, and CTAs for each clip</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
