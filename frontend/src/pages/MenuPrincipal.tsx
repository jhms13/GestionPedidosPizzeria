import MenuCarrousel from "../components/menuCarrousel";
import MenuSection from "../components/menuSection";

export default function MenuPrincipal() {
  return (
    <div className="min-h-screen bg-gray-50">
        
        {/* El carrusel superior */}
        <MenuCarrousel />
        
        {/* La sección azul con todas las pizzas */}
        <MenuSection />
        
    </div>
  );
}