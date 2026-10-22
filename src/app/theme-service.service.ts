import { Injectable, OnInit, signal } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    isDarkTheme = signal<boolean>(false);

    constructor() {
        const currentTheme = localStorage.getItem("dark-theme");
        this.isDarkTheme.set(currentTheme === "true");
        this.applyTheme();
    }

    toggleTheme(isDark: boolean) {
        this.isDarkTheme.set(isDark);
        localStorage.setItem("dark-theme", isDark.toString());
        this.applyTheme();
    }

    applyTheme() {
        if(this.isDarkTheme()) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
}

