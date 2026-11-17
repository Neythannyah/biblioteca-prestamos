import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Hook para atajos de teclado globales del sistema (RNF Usabilidad y Accesibilidad)
 * - Alt + N / Ctrl + Alt + N: Ir a Nuevo Préstamo
 * - Alt + D / Ctrl + Alt + D: Ir a Dashboard
 * - Alt + L / Ctrl + Alt + L: Ir a Catálogo de Libros
 * - Alt + U / Ctrl + Alt + U: Ir a Gestión de Usuarios
 * - Alt + M / Ctrl + Alt + M: Ir a Multas
 * - Alt + R / Ctrl + Alt + R: Ir a Reportes
 * - '/' o Ctrl + K: Enfocar buscador global en la barra superior
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Si el usuario está escribiendo dentro de un input o textarea y no es un atajo con Ctrl/Alt, no interceptar
      const esInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)

      // Atajo Ctrl+K o tecla '/' para buscar
      if ((e.ctrlKey && e.key.toLowerCase() === 'k') || (e.key === '/' && !esInput)) {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="Buscar"]')
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
        }
        return
      }

      // Atajos de navegación con Alt
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault()
            navigate('/prestamos/nuevo')
            break
          case 'd':
            e.preventDefault()
            navigate('/dashboard')
            break
          case 'l':
            e.preventDefault()
            navigate('/libros')
            break
          case 'u':
            e.preventDefault()
            navigate('/usuarios')
            break
          case 'p':
            e.preventDefault()
            navigate('/prestamos')
            break
          case 'v':
            e.preventDefault()
            navigate('/devoluciones')
            break
          case 'm':
            e.preventDefault()
            navigate('/multas')
            break
          case 'r':
            e.preventDefault()
            navigate('/reportes')
            break
          case 'c':
            e.preventDefault()
            navigate('/configuracion')
            break
          default:
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])
}

