import { Github, Linkedin, Mail, MapPin, Building } from "lucide-react"

export function Footer() {
    return (
        <footer className="border-t bg-background relative z-50"> {/* Added relative z-50 */}
            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {/* Institution Section */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Building className="h-6 w-6 text-primary" />
                            <span className="text-lg font-semibold">City of Malabon University</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            College of Computer Studies
                        </p>
                        <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>Pampano St, Maya-Maya, St. Brgy. Longos, Malabon City</span>
                        </div>
                    </div>

                    {/* Development Team */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Development & Research Team</h3>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">Benji I. Cañones</span>
                                <div className="flex space-x-2">
                                    <a href="benjicanones6@gmail.com" className="text-muted-foreground hover:text-foreground transition-colors">
                                        <Mail className="h-4 w-4" />
                                    </a>
                                    <a href="https://linkedin.com/in/benji-cañones" className="text-muted-foreground hover:text-foreground transition-colors">
                                        <Linkedin className="h-4 w-4" />
                                    </a>
                                    <a href="https://github.com/BenjiBenji20" className="text-muted-foreground hover:text-foreground transition-colors">
                                        <Github className="h-4 w-4" />
                                    </a>
                                </div>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">Aero Louise C. Arnaldo</span>
                                <div className="flex space-x-2">
                                    <a href="aeroarnaldo0329@gmail.com" className="text-muted-foreground hover:text-foreground transition-colors">
                                        <Mail className="h-4 w-4" />
                                    </a>
                                    <a href="https://github.com/Finnesz" className="text-muted-foreground hover:text-foreground transition-colors">
                                        <Github className="h-4 w-4" />
                                    </a>
                                </div>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">Kate Lavayne Marcos</span>
                                <div className="flex space-x-2">
                                    <a href="katelavaynemarcos@gmail.com" className="text-muted-foreground hover:text-foreground transition-colors">
                                        <Mail className="h-4 w-4" />
                                    </a>
                                </div>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">Vanessa Joyce M. Monterde</span>
                                <div className="flex space-x-2">
                                    <a href="monterdevanessa2@gmail.com" className="text-muted-foreground hover:text-foreground transition-colors">
                                        <Mail className="h-4 w-4" />
                                    </a>
                                </div>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">Wendy L. Pesimo</span>
                                <div className="flex space-x-2">
                                    <a href="pesimowend.y@gmail.com" className="text-muted-foreground hover:text-foreground transition-colors">
                                        <Mail className="h-4 w-4" />
                                    </a>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Advisers & Panelists */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Advisers & Panelists</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>Dr. Janine Moneda-Dela Cruz (Adviser)</li>
                            <li>Mr. Cerwin John T. Zaulda (Technical Adviser)</li>
                            <li>Dr. Enrico P. Chavez (Panel Chairman)</li>
                            <li>Dr. Jhuztine C. Pagad (Panel)</li>
                            <li>Prof. Michael Paul C. Buraga (Panel)</li>
                        </ul>
                    </div>

                    {/* Project Links */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Project Resources</h3>
                        <div className="space-y-3">
                            <a href="https://github.com/user-attachments/files/21940558/Group.6_.IoT-Based.Smart.Traffic.Monitoring.System.with.Data.Analytics.Along.Barangay.Longos.C-4.Road.for.Enhanced.Malabon.LGU.Decision-Making.pdf" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                                Research Document
                            </a>
                            <a href="https://github.com/BenjiBenji20/smart_traffic_monitoring_system" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                                Project Repository
                            </a>
                        </div>

                        {/* Tech Stack */}
                        <div className="pt-4">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                Built With
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                                    Python
                                </span>
                                <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                                    YOLO
                                </span>
                                <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                                    PyTorch
                                </span>
                                <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                                    FastAPI
                                </span>
                                <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                                    Raspberry Pi
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="mt-8 border-t pt-8">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                        <p className="text-sm text-muted-foreground text-center md:text-left">
                            © 2025-2026 City of Malabon University - College of Computer Studies. All rights reserved.
                        </p>
                        <div className="flex gap-6 text-sm text-muted-foreground">
                            <span className="text-xs text-muted-foreground/70">
                                Capstone Project
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}