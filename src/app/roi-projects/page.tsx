"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { PlusCircle, MoreVertical, Calculator, Trash2, ExternalLink } from 'lucide-react';
import AuthForm from '@/components/ui/auth/AuthForm';
import { RoiProject, getProjects, createProject, deleteProject, initializeProjectFromDefault } from '@/lib/project/projectApi';
import { useToast } from '@/components/ui/use-toast';

export default function ROIProjectsPage() {
  const { currentUser, loading } = useAuth();
  const [projects, setProjects] = useState<RoiProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openNewProject, setOpenNewProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const loadProjects = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        const loadedProjects = await getProjects(currentUser.uid);
        setProjects(loadedProjects);
      } catch (error) {
        console.error('Fel vid hämtning av projekt:', error);
        toast({
          title: "Kunde inte ladda projekt",
          description: "Det gick inte att hämta dina projekt. Försök igen.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (currentUser) {
      loadProjects();
    } else {
      setIsLoading(false);
    }
  }, [currentUser, toast]);

  const handleCreateProject = async () => {
    if (!currentUser) return;
    
    if (!projectName.trim()) {
      toast({
        title: "Projektnamn saknas",
        description: "Du måste ange ett namn för projektet.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Skapa nytt projekt i Firebase
      const newProject = await createProject(currentUser.uid, {
        name: projectName,
        description: projectDescription
      });
      
      // Initiera projektet med standarddata (valfritt)
      await initializeProjectFromDefault(currentUser.uid, newProject.id);
      
      toast({
        title: "Projekt skapat",
        description: `Projektet "${projectName}" har skapats.`
      });
      
      setProjects(prev => [newProject, ...prev]);
      setOpenNewProject(false);
      setProjectName('');
      setProjectDescription('');
    } catch (error) {
      console.error('Fel vid skapande av projekt:', error);
      toast({
        title: "Ett fel uppstod",
        description: "Det gick inte att skapa projektet. Försök igen senare.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!currentUser) return;
    
    const projectToDelete = projects.find(p => p.id === projectId);
    if (!projectToDelete) return;
    
    const confirm = window.confirm('Är du säker på att du vill ta bort projektet "' + projectToDelete.name + '"?');
    
    if (confirm) {
      try {
        await deleteProject(currentUser.uid, projectId);
        
        toast({
          title: "Projekt borttaget",
          description: `Projektet "${projectToDelete.name}" har tagits bort.`
        });
        
        setProjects(prev => prev.filter(p => p.id !== projectId));
      } catch (error) {
        console.error('Fel vid borttagning av projekt:', error);
        toast({
          title: "Ett fel uppstod",
          description: "Det gick inte att ta bort projektet. Försök igen senare.",
          variant: "destructive"
        });
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Om användaren inte är inloggad, visa login-formuläret
  if (!loading && !currentUser) {
    return (
      <div className="container py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">ROI-projekt</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Logga in eller registrera dig för att hantera dina ROI-projekt
          </p>
        </div>
        
        <div className="flex justify-center">
          <AuthForm />
        </div>
      </div>
    );
  }

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-xl">Laddar...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">ROI-projekt</h1>
          <p className="text-muted-foreground">Hantera dina olika ROI-kalkylprojekt</p>
        </div>
        
        <Dialog open={openNewProject} onOpenChange={setOpenNewProject}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle className="h-5 w-5" />
              Nytt projekt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Skapa nytt ROI-projekt</DialogTitle>
              <DialogDescription>
                Ange ett namn och eventuell beskrivning för ditt nya ROI-projekt.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Projektnamn</Label>
                <Input 
                  id="projectName" 
                  value={projectName} 
                  onChange={(e) => setProjectName(e.target.value)} 
                  placeholder="T.ex. Stressminskningsprogram 2024"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectDescription">Beskrivning (valfritt)</Label>
                <Textarea 
                  id="projectDescription" 
                  value={projectDescription} 
                  onChange={(e) => setProjectDescription(e.target.value)} 
                  placeholder="Kort beskrivning av projektet"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenNewProject(false)}>Avbryt</Button>
              <Button onClick={handleCreateProject}>Skapa projekt</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/roi?projectId=${project.id}`} className="flex items-center gap-2">
                          <Calculator className="h-4 w-4" /> Öppna ROI-kalkylator
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/rapporter?projectId=${project.id}`} className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" /> Visa rapport
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Ta bort
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>
                  Skapad: {formatDate(project.createdAt)}
                  {project.updatedAt !== project.createdAt && 
                    ` • Uppdaterad: ${formatDate(project.updatedAt)}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {project.description ? (
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Ingen beskrivning</p>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild
                >
                  <Link href={`/rapporter?projectId=${project.id}`}>
                    Visa rapport
                  </Link>
                </Button>
                <Button 
                  size="sm" 
                  asChild
                >
                  <Link href={`/roi?projectId=${project.id}`}>
                    Öppna kalkylator
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/30 rounded-lg border border-border">
          <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Inga projekt ännu</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Du har inte skapat några ROI-projekt än. Klicka på &quot;Nytt projekt&quot; för att komma igång.
          </p>
          <Button onClick={() => setOpenNewProject(true)}>
            <PlusCircle className="h-5 w-5 mr-2" />
            Skapa ditt första projekt
          </Button>
        </div>
      )}
    </div>
  );
} 