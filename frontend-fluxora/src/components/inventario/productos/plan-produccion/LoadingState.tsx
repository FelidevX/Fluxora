export default function LoadingState() {
  return (
    <div className="flex items-center justify-center py-8 md:py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-sm md:text-base text-gray-600 px-4">
          Cargando plan de producción...
        </p>
      </div>
    </div>
  );
}
