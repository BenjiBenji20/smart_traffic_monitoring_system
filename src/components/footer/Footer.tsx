import { Link } from "react-router"
import { Twitter, Github, Linkedin, Mail } from "lucide-react"

export function Footer() {
    return (
        <footer className="border-t bg-background">
            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
                                <span className="text-sm font-bold text-primary-foreground">S</span>
                            </div>
                            <span className="text-lg font-semibold">shadcn/ui</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Beautifully designed components built with Radix UI and Tailwind CSS.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Github className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Linkedin className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Mail className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Documentation Links */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Documentation</h3>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link to="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
                                    Introduction
                                </Link>
                            </li>
                            <li>
                                <Link to="/docs/installation" className="text-muted-foreground hover:text-foreground transition-colors">
                                    Installation
                                </Link>
                            </li>
                            <li>
                                <Link to="/docs/components" className="text-muted-foreground hover:text-foreground transition-colors">
                                    Components
                                </Link>
                            </li>
                            <li>
                                <Link to="/docs/theming" className="text-muted-foreground hover:text-foreground transition-colors">
                                    Theming
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Resources</h3>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    GitHub
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    Discord
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    Twitter
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    Figma
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Stay Updated</h3>
                        <p className="text-sm text-muted-foreground">
                            Subscribe to our newsletter for the latest updates.
                        </p>
                        <form className="space-y-2">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                            <button
                                type="submit"
                                className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="mt-8 border-t pt-8">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                        <p className="text-sm text-muted-foreground">
                            © 2024 shadcn/ui. All rights reserved.
                        </p>
                        <div className="flex gap-6 text-sm text-muted-foreground">
                            <a href="#" className="hover:text-foreground transition-colors">
                                Privacy Policy
                            </a>
                            <a href="#" className="hover:text-foreground transition-colors">
                                Terms of Service
                            </a>
                            <a href="#" className="hover:text-foreground transition-colors">
                                Cookie Policy
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}