package com.proyecto.spring.social_service.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class UsuarioController {

    @GetMapping("/detalles_usuario")

    public String info(Model model) {
        model.addAttribute("Titulo", "Hola");
        model.addAttribute("Presentacion", "Pagina de usuario");

        return "detalles_usuario";

    }

}
